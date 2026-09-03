import { NextRequest, NextResponse } from "next/server";
import { assertCronRequest } from "@/lib/cron-auth";
import { handleApiError } from "@/lib/api-errors";
import { sendDueReminders } from "@/lib/reminders/send";

/**
 * Manual entry point for the reminder job.
 *
 * The scheduling itself lives in `src/lib/jobs` — this endpoint stays so the
 * job can be re-run on demand while debugging, and so an external pinger can
 * target it directly if needed.
 */
export async function GET(request: NextRequest) {
  try {
    assertCronRequest(request);

    return NextResponse.json(await sendDueReminders());
  } catch (error) {
    return handleApiError(error);
  }
}
