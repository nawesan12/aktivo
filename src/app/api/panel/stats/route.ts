import { NextResponse } from "next/server";
import { getSessionBusiness, requireBusinessPermission } from "@/lib/auth/session-business";
import { handleApiError } from "@/lib/api-errors";
import { getDashboardStats } from "@/lib/panel/dashboard-stats";
import { runInBackground } from "@/lib/background";
import { maybeTick } from "@/lib/jobs/tick";

export async function GET() {
  try {
    const session = await getSessionBusiness();
    await requireBusinessPermission(session, "reports:read");

    // Real traffic is what drives the background jobs on the free plan: no
    // Vercel cron can run more than once a day there. See `src/lib/jobs/tick.ts`.
    runInBackground("tick", maybeTick);

    return NextResponse.json(await getDashboardStats(session.businessId));
  } catch (error) {
    return handleApiError(error, "panel:stats");
  }
}
