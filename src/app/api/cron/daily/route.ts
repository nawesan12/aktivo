import { NextRequest, NextResponse } from "next/server";
import { assertCronRequest } from "@/lib/cron-auth";
import { handleApiError } from "@/lib/api-errors";
import { runDueJobs } from "@/lib/jobs/tick";
import { createLogger } from "@/lib/logger";

const log = createLogger("cron:daily");

/**
 * The one scheduled job the free plan allows.
 *
 * Everything else runs opportunistically off real traffic (see
 * `src/lib/jobs/tick.ts`); this is the floor underneath, and the only owner of
 * the work that has to happen on a given day whether or not anybody visited the
 * site — campaigns, above all.
 *
 * It runs with `force`, so a tick that happened a minute ago cannot talk it out
 * of running.
 */
export async function GET(request: NextRequest) {
  try {
    assertCronRequest(request);

    const result = await runDueJobs({ force: true });

    // The line that says whether traffic is enough to keep the tick alive: if
    // these counters are consistently high, nothing else is doing the work.
    log.info("daily run", result.ran);

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
