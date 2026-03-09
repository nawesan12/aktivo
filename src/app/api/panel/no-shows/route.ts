import { NextResponse } from "next/server";
import { getSessionBusiness } from "@/lib/auth/session-business";
import { requirePermission } from "@/lib/auth/rbac";
import { getNoShowStats } from "@/lib/no-show";
import { handleApiError } from "@/lib/api-errors";

export async function GET() {
  try {
    const session = await getSessionBusiness();
    requirePermission(session.role, "noshow:read");

    const stats = await getNoShowStats(session.businessId);

    return NextResponse.json(stats);
  } catch (error) {
    return handleApiError(error);
  }
}
