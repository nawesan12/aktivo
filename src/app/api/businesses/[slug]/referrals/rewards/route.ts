import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { handleApiError, AuthError } from "@/lib/api-errors";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new AuthError();
    }

    const { slug } = await params;

    const business = await db.business.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }

    const referral = await db.referral.findFirst({
      where: {
        businessId: business.id,
        userId: session.user.id,
      },
    });

    if (!referral) {
      return NextResponse.json({ rewards: [] });
    }

    const [coupons, settings] = await Promise.all([
      db.coupon.findMany({
        where: {
          businessId: business.id,
          code: { startsWith: "REF-" + referral.code + "-" },
        },
      }),
      db.businessSettings.findUnique({
        where: { businessId: business.id },
        select: {
          referralRewardType: true,
          referralRewardValue: true,
        },
      }),
    ]);

    return NextResponse.json({
      rewards: coupons,
      referralConfig: {
        referralRewardType: settings?.referralRewardType ?? null,
        referralRewardValue: settings?.referralRewardValue ?? null,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
