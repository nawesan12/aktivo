import { NextRequest, NextResponse } from "next/server";
import { getSessionBusiness, requireBusinessPermission } from "@/lib/auth/session-business";
import { handleApiError } from "@/lib/api-errors";
import { requirePlan } from "@/lib/subscription/enforcement";
import { getRevenueData } from "@/lib/analytics/revenue";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionBusiness();
    await requireBusinessPermission(session, "analytics:read");
    await requirePlan(session.businessId, "PROFESSIONAL");

    const searchParams = request.nextUrl.searchParams;
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const groupBy = (searchParams.get("groupBy") as "day" | "week" | "month") || "day";

    const now = new Date();
    const startDate = startDateParam
      ? new Date(startDateParam)
      : new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
    const endDate = endDateParam ? new Date(endDateParam) : now;

    const data = await getRevenueData(session.businessId, {
      startDate,
      endDate,
      groupBy,
    });

    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}
