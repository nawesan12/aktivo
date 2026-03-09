import { NextRequest, NextResponse } from "next/server";
import { getSessionBusiness } from "@/lib/auth/session-business";
import { requirePermission } from "@/lib/auth/rbac";
import { handleApiError } from "@/lib/api-errors";
import { requirePlan } from "@/lib/subscription/enforcement";
import { getChurnData } from "@/lib/analytics/churn";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionBusiness();
    requirePermission(session.role, "analytics:read");
    await requirePlan(session.businessId, "PROFESSIONAL");

    const days = parseInt(request.nextUrl.searchParams.get("days") || "30");
    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "50");
    const data = await getChurnData(session.businessId, days, limit);

    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}
