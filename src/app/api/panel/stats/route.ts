import { NextResponse } from "next/server";
import { getSessionBusiness } from "@/lib/auth/session-business";
import { requirePermission } from "@/lib/auth/rbac";
import { handleApiError } from "@/lib/api-errors";
import { getDashboardStats } from "@/lib/panel/dashboard-stats";

export async function GET() {
  try {
    const session = await getSessionBusiness();
    requirePermission(session.role, "reports:read");

    return NextResponse.json(await getDashboardStats(session.businessId));
  } catch (error) {
    return handleApiError(error, "panel:stats");
  }
}
