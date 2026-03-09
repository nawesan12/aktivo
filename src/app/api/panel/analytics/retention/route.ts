import { NextRequest, NextResponse } from "next/server";
import { getSessionBusiness } from "@/lib/auth/session-business";
import { requirePermission } from "@/lib/auth/rbac";
import { handleApiError } from "@/lib/api-errors";
import { requirePlan } from "@/lib/subscription/enforcement";
import { getRetentionData } from "@/lib/analytics/retention";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionBusiness();
    requirePermission(session.role, "analytics:read");
    await requirePlan(session.businessId, "PROFESSIONAL");

    const months = parseInt(request.nextUrl.searchParams.get("months") || "6");
    const data = await getRetentionData(session.businessId, months);

    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}
