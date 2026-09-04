import { NextRequest, NextResponse } from "next/server";
import { getSessionBusiness, requireBusinessPermission } from "@/lib/auth/session-business";
import { handleApiError } from "@/lib/api-errors";
import { requirePlan } from "@/lib/subscription/enforcement";
import { getPeakHoursData } from "@/lib/analytics/peak-hours";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionBusiness();
    await requireBusinessPermission(session, "analytics:read");
    await requirePlan(session.businessId, "PROFESSIONAL");

    const days = parseInt(request.nextUrl.searchParams.get("days") || "90");
    const startDate = request.nextUrl.searchParams.get("startDate");
    const endDate = request.nextUrl.searchParams.get("endDate");
    const data = await getPeakHoursData(session.businessId, {
      days,
      ...(startDate && { startDate: new Date(startDate) }),
      ...(endDate && { endDate: new Date(endDate) }),
    });

    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}
