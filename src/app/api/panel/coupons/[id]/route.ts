import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionBusiness } from "@/lib/auth/session-business";
import { requirePermission } from "@/lib/auth/rbac";
import { logAction } from "@/lib/audit";
import { handleApiError } from "@/lib/api-errors";
import type { CouponType } from "@/generated/prisma/client";

const VALID_COUPON_TYPES: CouponType[] = ["PERCENTAGE", "FIXED"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionBusiness();
    requirePermission(session.role, "coupons:manage");

    const { id } = await params;
    const body = await request.json();

    const existing = await db.coupon.findFirst({
      where: { id, businessId: session.businessId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Cupón no encontrado" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};

    if (body.code !== undefined) updateData.code = body.code.toUpperCase();
    if (body.type !== undefined) {
      if (!VALID_COUPON_TYPES.includes(body.type as CouponType)) {
        return NextResponse.json(
          { error: "Tipo de cupón inválido. Debe ser PERCENTAGE o FIXED" },
          { status: 400 }
        );
      }
      updateData.type = body.type;
    }
    if (body.value !== undefined) updateData.value = Number(body.value);
    if (body.minAmount !== undefined) updateData.minAmount = body.minAmount != null ? Number(body.minAmount) : null;
    if (body.maxUses !== undefined) updateData.maxUses = body.maxUses != null ? Number(body.maxUses) : null;
    if (body.validUntil !== undefined) updateData.validUntil = body.validUntil ? new Date(body.validUntil) : null;
    if (body.isActive !== undefined) updateData.isActive = Boolean(body.isActive);

    const coupon = await db.coupon.update({
      where: { id },
      data: updateData,
      include: {
        _count: { select: { redemptions: true } },
      },
    });

    await logAction({
      businessId: session.businessId,
      userId: session.userId,
      action: "coupon:update",
      entity: "Coupon",
      entityId: id,
      details: updateData,
    });

    return NextResponse.json(coupon);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionBusiness();
    requirePermission(session.role, "coupons:manage");

    const { id } = await params;

    const existing = await db.coupon.findFirst({
      where: { id, businessId: session.businessId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Cupón no encontrado" }, { status: 404 });
    }

    await db.coupon.delete({ where: { id } });

    await logAction({
      businessId: session.businessId,
      userId: session.userId,
      action: "coupon:delete",
      entity: "Coupon",
      entityId: id,
      details: { code: existing.code },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
