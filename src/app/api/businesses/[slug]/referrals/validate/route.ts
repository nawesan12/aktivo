import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/api-errors";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json({ valid: false });
    }

    const business = await db.business.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!business) {
      return NextResponse.json({ valid: false });
    }

    const referral = await db.referral.findUnique({
      where: {
        businessId_code: {
          businessId: business.id,
          code,
        },
      },
    });

    if (!referral) {
      return NextResponse.json({ valid: false });
    }

    return NextResponse.json({ valid: true, referralId: referral.id });
  } catch (error) {
    return handleApiError(error, "businesses:slug:referrals:validate");
  }
}
