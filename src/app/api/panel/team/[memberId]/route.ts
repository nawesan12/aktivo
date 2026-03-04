import { NextResponse } from "next/server";
import { getSessionBusiness } from "@/lib/auth/session-business";
import { requirePermission } from "@/lib/auth/rbac";
import { db } from "@/lib/db";
import { logAction } from "@/lib/audit";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const session = await getSessionBusiness();
    requirePermission(session.role, "team:manage");
    const { memberId } = await params;

    const body = await request.json();
    const { role, isActive } = body;

    const updateData: Record<string, unknown> = {};
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;

    await db.userBusiness.update({
      where: { id: memberId },
      data: updateData,
    });

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
    const msg = error instanceof Error ? error.message : "Error interno";
    const status = msg.includes("No autenticado") ? 401 : msg.includes("Permisos") ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const session = await getSessionBusiness();
    requirePermission(session.role, "team:manage");
    const { memberId } = await params;

    const member = await db.userBusiness.findUnique({
      where: { id: memberId },
      select: { userId: true },
    });

    if (member?.userId === session.userId) {
      return NextResponse.json({ error: "No podes eliminarte a vos mismo" }, { status: 400 });
    }

    await db.userBusiness.update({
      where: { id: memberId },
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
    const msg = error instanceof Error ? error.message : "Error interno";
    const status = msg.includes("No autenticado") ? 401 : msg.includes("Permisos") ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
