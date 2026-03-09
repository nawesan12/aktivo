import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionBusiness } from "@/lib/auth/session-business";
import { requirePermission } from "@/lib/auth/rbac";
import { logAction } from "@/lib/audit";
import { handleApiError } from "@/lib/api-errors";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionBusiness();
    requirePermission(session.role, "services:update");

    const { id } = await params;
    const body = await request.json();

    const existing = await db.serviceCategory.findFirst({
      where: { id, businessId: session.businessId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Categoria no encontrada" }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (body.name) data.name = body.name;
    if (body.sortOrder !== undefined) data.sortOrder = body.sortOrder;

    const category = await db.serviceCategory.update({
      where: { id },
      data,
    });

    await logAction({
      businessId: session.businessId,
      userId: session.userId,
      action: "category:update",
      entity: "ServiceCategory",
      entityId: id,
      details: data,
    });

    return NextResponse.json(category);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionBusiness();
    requirePermission(session.role, "services:delete");

    const { id } = await params;
    const existing = await db.serviceCategory.findFirst({
      where: { id, businessId: session.businessId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Categoria no encontrada" }, { status: 404 });
    }

    // Unlink services from category before deleting
    await db.service.updateMany({
      where: { categoryId: id, businessId: session.businessId },
      data: { categoryId: null },
    });

    await db.serviceCategory.delete({ where: { id } });

    await logAction({
      businessId: session.businessId,
      userId: session.userId,
      action: "category:delete",
      entity: "ServiceCategory",
      entityId: id,
      details: { name: existing.name },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
