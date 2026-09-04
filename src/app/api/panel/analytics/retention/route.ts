import { NextRequest, NextResponse } from "next/server";
import { getSessionBusiness, requireBusinessPermission } from "@/lib/auth/session-business";
import { handleApiError } from "@/lib/api-errors";
import { requirePlan } from "@/lib/subscription/enforcement";
import { getRetentionData } from "@/lib/analytics/retention";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionBusiness();
    await requireBusinessPermission(session, "analytics:read");
    await requirePlan(session.businessId, "PROFESSIONAL");

    const months = parseInt(request.nextUrl.searchParams.get("months") || "6");
    const startDate = request.nextUrl.searchParams.get("startDate");
    const endDate = request.nextUrl.searchParams.get("endDate");
    const data = await getRetentionData(session.businessId, {
      months,
      ...(startDate && { startDate: new Date(startDate) }),
      ...(endDate && { endDate: new Date(endDate) }),
    });

    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}
