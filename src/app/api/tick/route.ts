import { NextRequest, NextResponse } from "next/server";
import { assertCronRequest } from "@/lib/cron-auth";
import { handleApiError } from "@/lib/api-errors";
import { runDueJobs } from "@/lib/jobs/tick";

/**
 * Target for an external pinger.
 *
 * Traffic alone cannot carry the 1-hour reminder: the first appointments of the
 * day fall in the window before the shop opens, when nobody is browsing and the
 * owner has not opened the panel yet — so those clients would never be
 * reminded, every day. A free HTTP monitor hitting this every few minutes
 * closes that hole without a Vercel cron.
 *
 * Same secret as the cron endpoints, so it is not an open trigger.
 */
export async function GET(request: NextRequest) {
  try {
    assertCronRequest(request);

    return NextResponse.json(await runDueJobs());
  } catch (error) {
    return handleApiError(error);
  }
}
