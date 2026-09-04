import { NextResponse } from "next/server";
import { getSessionBusiness, requireBusinessPermission } from "@/lib/auth/session-business";
import { getNoShowStats } from "@/lib/no-show";
import { handleApiError } from "@/lib/api-errors";

export async function GET() {
  try {
    const session = await getSessionBusiness();
    await requireBusinessPermission(session, "noshow:read");

    const stats = await getNoShowStats(session.businessId);

    return NextResponse.json(stats);
  } catch (error) {
    return handleApiError(error);
  }
}
