import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionBusiness } from "@/lib/auth/session-business";
import { requirePermission } from "@/lib/auth/rbac";
import { handleApiError } from "@/lib/api-errors";
import { requirePlan } from "@/lib/subscription/enforcement";

export async function GET() {
  try {
    const session = await getSessionBusiness();
    requirePermission(session.role, "group:read");

    const business = await db.business.findUnique({
      where: { id: session.businessId },
      select: { groupId: true },
    });

    if (!business?.groupId) {
      return NextResponse.json({ group: null });
    }

    const group = await db.businessGroup.findUnique({
      where: { id: business.groupId },
      include: {
        businesses: {
          where: { isActive: true },
          select: { id: true, name: true, slug: true, logo: true, city: true },
          orderBy: { name: "asc" },
        },
        owner: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ group });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionBusiness();
    requirePermission(session.role, "group:manage");
    await requirePlan(session.businessId, "ENTERPRISE");

    const body = await request.json();
    const { name, logo } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
    }

    // Check if business already belongs to a group
    const business = await db.business.findUnique({
      where: { id: session.businessId },
      select: { groupId: true },
    });

    if (business?.groupId) {
      return NextResponse.json({ error: "Este negocio ya pertenece a un grupo" }, { status: 409 });
    }

    // Create group and associate current business
    const group = await db.$transaction(async (tx) => {
      const newGroup = await tx.businessGroup.create({
        data: {
          ownerId: session.userId,
          name: name.trim(),
          logo: logo || null,
        },
      });

      await tx.business.update({
        where: { id: session.businessId },
        data: { groupId: newGroup.id },
      });

      return newGroup;
    });

    return NextResponse.json(group, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
