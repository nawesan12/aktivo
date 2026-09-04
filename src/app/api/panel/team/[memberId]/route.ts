import { NextResponse } from "next/server";
import { getSessionBusiness, requireBusinessPermission } from "@/lib/auth/session-business";
import { db } from "@/lib/db";
import { logAction } from "@/lib/audit";
import { handleApiError, NotFoundError, ValidationError } from "@/lib/api-errors";

/**
 * Roles that can be assigned to a member from the panel. Mirrors the whitelist
 * used when inviting (../route.ts): BUSINESS_OWNER and PLATFORM_ADMIN are not
 * assignable here, so this endpoint can't be used to escalate privileges.
 */
const ASSIGNABLE_ROLES = ["BUSINESS_MANAGER", "STAFF_MEMBER", "RECEPTIONIST"];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const session = await getSessionBusiness();
    await requireBusinessPermission(session, "team:manage");
    const { memberId } = await params;

    const body = await request.json();
    const { role, isActive } = body;

    if (role !== undefined && !ASSIGNABLE_ROLES.includes(role)) {
      throw new ValidationError("Rol inválido");
    }

    const updateData: Record<string, unknown> = {};
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Scoped by businessId in the WHERE itself: memberId comes from the client
    // and must never reach a member of another business.
    const updated = await db.userBusiness.updateMany({
      where: { id: memberId, businessId: session.businessId },
      data: updateData,
    });

    if (updated.count === 0) {
      throw new NotFoundError("Miembro no encontrado");
    }

    await logAction({
      businessId: session.businessId,
      userId: session.userId,
      action: "team:update_member",
      entity: "userBusiness",
      entityId: memberId,
      details: updateData as Record<string, unknown>,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const session = await getSessionBusiness();
    await requireBusinessPermission(session, "team:manage");
    const { memberId } = await params;

    const member = await db.userBusiness.findFirst({
      where: { id: memberId, businessId: session.businessId },
      select: { userId: true },
    });

    if (!member) {
      throw new NotFoundError("Miembro no encontrado");
    }

    if (member.userId === session.userId) {
      return NextResponse.json({ error: "No podes eliminarte a vos mismo" }, { status: 400 });
    }

    await db.userBusiness.updateMany({
      where: { id: memberId, businessId: session.businessId },
      data: { isActive: false },
    });

    await logAction({
      businessId: session.businessId,
      userId: session.userId,
      action: "team:deactivate_member",
      entity: "userBusiness",
      entityId: memberId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
