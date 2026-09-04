import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionBusiness, requireBusinessPermission } from "@/lib/auth/session-business";
import { requirePlan } from "@/lib/subscription/enforcement";
import { getBusinessAccess } from "@/lib/subscription/access";
import { handleApiError } from "@/lib/api-errors";
import { z } from "zod";

const locationSchema = z.object({
  name: z.string().trim().min(2, "Mínimo 2 caracteres").max(80),
  // Same shape as the main business slug: it becomes a URL, and a slug with a
  // space or a slash in it produces a branch nobody can reach.
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Mínimo 3 caracteres")
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Solo letras minúsculas, números y guiones"),
  address: z.string().trim().max(200).optional().nullable(),
  city: z.string().trim().max(80).optional().nullable(),
  phone: z.string().trim().max(30).optional().nullable(),
  email: z.string().email("Email inválido").optional().nullable().or(z.literal("")),
});

export async function GET() {
  try {
    const session = await getSessionBusiness();
    await requireBusinessPermission(session, "group:read");

    const business = await db.business.findUnique({
      where: { id: session.businessId },
      select: { groupId: true },
    });

    if (!business?.groupId) {
      return NextResponse.json({ data: [] });
    }

    const locations = await db.business.findMany({
      where: { groupId: business.groupId, isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        address: true,
        city: true,
        phone: true,
        _count: {
          select: {
            staff: true,
            services: true,
            appointments: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ data: locations });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionBusiness();
    await requireBusinessPermission(session, "group:manage");
    // Creating the group needed ENTERPRISE; adding to it has to as well, or a
    // downgraded account keeps opening branches on a plan that doesn't include
    // them.
    await requirePlan(session.businessId, "ENTERPRISE");

    const currentBusiness = await db.business.findUnique({
      where: { id: session.businessId },
      select: { groupId: true },
    });

    if (!currentBusiness?.groupId) {
      return NextResponse.json({ error: "No pertenece a un grupo" }, { status: 400 });
    }

    const { name, slug, address, city, phone, email } = locationSchema.parse(
      await request.json()
    );

    // A branch opened while the parent is still on its trial had no trial of
    // its own and no subscription to inherit yet, so it was born blocked: the
    // owner created it and immediately hit the payment wall inside it. It gets
    // whatever is left of the parent's trial — not a fresh one, which would be
    // a way to stay free forever by opening a new branch every week.
    const parentAccess = await getBusinessAccess(session.businessId);

    const newBusiness = await db.business.create({
      data: {
        name,
        slug,
        address: address || null,
        city: city || null,
        phone: phone || null,
        email: email || null,
        groupId: currentBusiness.groupId,
        trialEndsAt: parentAccess.trialEndsAt,
        settings: {
          create: {},
        },
      },
    });

    // Add owner to the new business
    await db.userBusiness.create({
      data: {
        userId: session.userId,
        businessId: newBusiness.id,
        role: "BUSINESS_OWNER",
      },
    });

    return NextResponse.json(newBusiness, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
