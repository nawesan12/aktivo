import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionBusiness, requireBusinessPermission } from "@/lib/auth/session-business";
import { logAction } from "@/lib/audit";
import { handleApiError } from "@/lib/api-errors";
import type { CouponType } from "@/generated/prisma/client";

const VALID_COUPON_TYPES: CouponType[] = ["PERCENTAGE", "FIXED"];

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionBusiness();
    await requireBusinessPermission(session, "coupons:read");

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;

    const [coupons, total] = await Promise.all([
      db.coupon.findMany({
        where: { businessId: session.businessId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          _count: { select: { redemptions: true } },
        },
      }),
      db.coupon.count({ where: { businessId: session.businessId } }),
    ]);

    // The panel shows three counters over the table. They read `stats.*`, which
    // this route never sent — so a business with fifty coupons saw three zeros.
    const [active, redemptions] = await Promise.all([
      db.coupon.count({
        where: {
          businessId: session.businessId,
          isActive: true,
          OR: [{ validUntil: null }, { validUntil: { gte: new Date() } }],
        },
      }),
      db.couponRedemption.count({
        where: { coupon: { businessId: session.businessId } },
      }),
    ]);

    return NextResponse.json({
      data: coupons,
      stats: { total, active, totalRedemptions: redemptions },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionBusiness();
    await requireBusinessPermission(session, "coupons:manage");

    const body = await request.json();
    const { code, type, value, minAmount, maxUses, validFrom, validUntil } = body;

    if (!code || !type || value === undefined || value === null) {
      return NextResponse.json(
        { error: "Código, tipo y valor son requeridos" },
        { status: 400 }
      );
    }

    if (!VALID_COUPON_TYPES.includes(type as CouponType)) {
      return NextResponse.json(
        { error: "Tipo de cupón inválido. Debe ser PERCENTAGE o FIXED" },
        { status: 400 }
      );
    }

    const upperCode = code.toUpperCase();

    const existing = await db.coupon.findUnique({
      where: {
        businessId_code: {
          businessId: session.businessId,
          code: upperCode,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Ya existe un cupón con este código" },
        { status: 409 }
      );
    }

    const coupon = await db.coupon.create({
      data: {
        businessId: session.businessId,
        code: upperCode,
        type: type as CouponType,
        value: Number(value),
        minAmount: minAmount != null ? Number(minAmount) : null,
        maxUses: maxUses != null ? Number(maxUses) : null,
        validFrom: validFrom ? new Date(validFrom) : new Date(),
        validUntil: validUntil ? new Date(validUntil) : null,
      },
      include: {
        _count: { select: { redemptions: true } },
      },
    });

    await logAction({
      businessId: session.businessId,
      userId: session.userId,
      action: "coupon:create",
      entity: "Coupon",
      entityId: coupon.id,
      details: { code: upperCode, type, value },
    });

    return NextResponse.json(coupon, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
