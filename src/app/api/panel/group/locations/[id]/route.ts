import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionBusiness } from "@/lib/auth/session-business";
import { requirePermission } from "@/lib/auth/rbac";
import { handleApiError } from "@/lib/api-errors";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionBusiness();
    requirePermission(session.role, "group:manage");
    const { id } = await params;

    // Verify location belongs to same group
    const currentBusiness = await db.business.findUnique({
      where: { id: session.businessId },
      select: { groupId: true },
    });

    const targetBusiness = await db.business.findUnique({
      where: { id },
      select: { groupId: true },
    });

    if (!currentBusiness?.groupId || currentBusiness.groupId !== targetBusiness?.groupId) {
      return NextResponse.json({ error: "Sin acceso a esta sucursal" }, { status: 403 });
    }

    const body = await request.json();
    const { name, address, city, phone, email, isActive } = body;

    const updated = await db.business.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(address !== undefined && { address }),
        ...(city !== undefined && { city }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
