import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionBusiness, requireBusinessPermission } from "@/lib/auth/session-business";
import { handleApiError } from "@/lib/api-errors";

const DEFAULTS = {
  referralEnabled: false,
  referralRewardType: null,
  referralRewardValue: null,
  referralMaxRedemptions: null,
};

export async function GET() {
  try {
    const session = await getSessionBusiness();
    await requireBusinessPermission(session, "settings:read");

    const settings = await db.businessSettings.findUnique({
      where: { businessId: session.businessId },
      select: {
        referralEnabled: true,
        referralRewardType: true,
        referralRewardValue: true,
        referralMaxRedemptions: true,
      },
    });

    return NextResponse.json(settings ?? DEFAULTS);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSessionBusiness();
    await requireBusinessPermission(session, "settings:update");

    const body = await request.json();

    const data: Record<string, unknown> = {};
    if (typeof body.referralEnabled === "boolean") {
      data.referralEnabled = body.referralEnabled;
    }
    if (body.referralRewardType !== undefined) {
      data.referralRewardType = body.referralRewardType;
    }
    if (body.referralRewardValue !== undefined) {
      data.referralRewardValue = body.referralRewardValue;
    }
    if (body.referralMaxRedemptions !== undefined) {
      data.referralMaxRedemptions = body.referralMaxRedemptions;
    }

    const updated = await db.businessSettings.update({
      where: { businessId: session.businessId },
      data,
      select: {
        referralEnabled: true,
        referralRewardType: true,
        referralRewardValue: true,
        referralMaxRedemptions: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
