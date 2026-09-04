import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionBusiness, requireBusinessPermission } from "@/lib/auth/session-business";
import { logAction } from "@/lib/audit";
import { handleApiError } from "@/lib/api-errors";
import type { CouponType } from "@/generated/prisma/client";
import { z } from "zod";

/**
 * `calculateCouponDiscount` already refuses to discount more than the price, so
 * a 150% coupon cannot take money out of the till. What it cannot do is tell
 * the owner they typed something that does not mean what they think — or stop
 * `new Date("mañana")` from reaching Prisma and coming back as a 500.
 */
const couponSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(3, "Mínimo 3 caracteres")
      .max(24, "Máximo 24 caracteres")
      .regex(/^[A-Za-z0-9-]+$/, "Solo letras, números y guiones")
      .transform((value) => value.toUpperCase()),
    type: z.enum(["PERCENTAGE", "FIXED"], {
      message: "Tipo de cupón inválido. Debe ser PERCENTAGE o FIXED",
    }),
    value: z.number().positive("El valor tiene que ser mayor a cero"),
    minAmount: z.number().nonnegative().nullable().optional(),
    maxUses: z.number().int().positive().nullable().optional(),
    validFrom: z.coerce.date().optional(),
    validUntil: z.coerce.date().nullable().optional(),
  })
  .refine((data) => data.type !== "PERCENTAGE" || data.value <= 100, {
    message: "Un porcentaje va de 1 a 100",
    path: ["value"],
  })
  .refine(
    (data) => !data.validUntil || !data.validFrom || data.validUntil > data.validFrom,
    { message: "La fecha de fin tiene que ser posterior a la de inicio", path: ["validUntil"] }
  );

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

    const { code, type, value, minAmount, maxUses, validFrom, validUntil } =
      couponSchema.parse(await request.json());

    const existing = await db.coupon.findUnique({
      where: {
        businessId_code: {
          businessId: session.businessId,
          code,
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
        code,
        type: type as CouponType,
        value,
        minAmount: minAmount ?? null,
        maxUses: maxUses ?? null,
        validFrom: validFrom ?? new Date(),
        validUntil: validUntil ?? null,
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
      details: { code, type, value },
    });

    return NextResponse.json(coupon, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
