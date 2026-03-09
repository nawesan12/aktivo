import { NextRequest, NextResponse } from "next/server";
import { getSessionBusiness } from "@/lib/auth/session-business";
import { requirePermission } from "@/lib/auth/rbac";
import { handleApiError } from "@/lib/api-errors";
import { requirePlan } from "@/lib/subscription/enforcement";
import { getLTVData } from "@/lib/analytics/ltv";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionBusiness();
    requirePermission(session.role, "analytics:read");
    await requirePlan(session.businessId, "PROFESSIONAL");

    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "20");
    const data = await getLTVData(session.businessId, limit);

    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}
