import { NextRequest, NextResponse } from "next/server";
import { getSessionBusiness } from "@/lib/auth/session-business";
import { requirePermission } from "@/lib/auth/rbac";
import { handleApiError } from "@/lib/api-errors";
import { requirePlan } from "@/lib/subscription/enforcement";
import { getPeakHoursData } from "@/lib/analytics/peak-hours";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionBusiness();
    requirePermission(session.role, "analytics:read");
    await requirePlan(session.businessId, "PROFESSIONAL");

    const days = parseInt(request.nextUrl.searchParams.get("days") || "90");
    const data = await getPeakHoursData(session.businessId, days);

    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}
