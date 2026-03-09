import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionBusiness } from "@/lib/auth/session-business";
import { requirePermission } from "@/lib/auth/rbac";
import { handleApiError } from "@/lib/api-errors";

export async function GET() {
  try {
    const session = await getSessionBusiness();
    requirePermission(session.role, "group:read");

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
    requirePermission(session.role, "group:manage");

    const currentBusiness = await db.business.findUnique({
      where: { id: session.businessId },
      select: { groupId: true },
    });

    if (!currentBusiness?.groupId) {
      return NextResponse.json({ error: "No pertenece a un grupo" }, { status: 400 });
    }

    const body = await request.json();
    const { name, slug, address, city, phone, email } = body;

    if (!name?.trim() || !slug?.trim()) {
      return NextResponse.json({ error: "Nombre y slug requeridos" }, { status: 400 });
    }

    const newBusiness = await db.business.create({
      data: {
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        address: address || null,
        city: city || null,
        phone: phone || null,
        email: email || null,
        groupId: currentBusiness.groupId,
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
