import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const { code, serviceId } = body;

    if (!code) {
      return NextResponse.json({ valid: false, reason: "Cupón no encontrado" });
    }

    const business = await db.business.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!business) {
      return NextResponse.json({ valid: false, reason: "Cupón no encontrado" });
    }

    const coupon = await db.coupon.findFirst({
      where: {
        businessId: business.id,
        code: { equals: code, mode: "insensitive" },
        isActive: true,
      },
    });

    if (!coupon) {
      return NextResponse.json({ valid: false, reason: "Cupón no encontrado" });
    }

    const now = new Date();

    if (coupon.validFrom && coupon.validFrom > now) {
      return NextResponse.json({ valid: false, reason: "Cupón expirado" });
    }

    if (coupon.validUntil && coupon.validUntil < now) {
      return NextResponse.json({ valid: false, reason: "Cupón expirado" });
    }

    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json({ valid: false, reason: "Cupón agotado" });
    }

    if (coupon.minAmount !== null && serviceId) {
      const service = await db.service.findUnique({
        where: { id: serviceId },
        select: { price: true },
      });

      if (service && Number(service.price) < coupon.minAmount) {
        return NextResponse.json({
          valid: false,
          reason: "No aplica para este servicio",
        });
      }
    }

    return NextResponse.json({
      valid: true,
      type: coupon.type,
      value: coupon.value,
      code: coupon.code,
    });
  } catch (error) {
    console.error("Error validating coupon:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
