import { NextRequest, NextResponse } from "next/server";
import { assertCronRequest } from "@/lib/cron-auth";
import { handleApiError } from "@/lib/api-errors";
import { createLogger } from "@/lib/logger";
import { runScheduledCampaigns } from "@/lib/campaigns/run";

const log = createLogger("cron:campaigns");

/**
 * Daily pass over the automated campaigns of every business.
 *
 * Birthday greetings, re-booking nudges and inactivity win-backs were all in
 * the product and in the UI, but nothing ever ran them: they only went out if
 * the owner remembered to press "run now" — which also, until now, mailed the
 * entire client list regardless of the campaign type.
 */
export async function GET(request: NextRequest) {
  try {
    assertCronRequest(request);

    const results = await runScheduledCampaigns();

    const totals = results.reduce(
      (acc, r) => ({
        campaigns: acc.campaigns + 1,
        sent: acc.sent + r.sent,
        failed: acc.failed + r.failed,
        skipped: acc.skipped + r.skipped,
      }),
      { campaigns: 0, sent: 0, failed: 0, skipped: 0 }
    );

    if (totals.sent > 0 || totals.failed > 0) {
      log.info("scheduled campaigns finished", totals);
    }

    return NextResponse.json(totals);
  } catch (error) {
    return handleApiError(error, "cron:campaigns");
  }
}
