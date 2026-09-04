import { NextRequest, NextResponse } from "next/server";
import { assertCronRequest } from "@/lib/cron-auth";
import { handleApiError } from "@/lib/api-errors";
import { runDueJobs } from "@/lib/jobs/tick";
import { createLogger } from "@/lib/logger";

const log = createLogger("cron:daily");

/**
 * The scheduled floor under the opportunistic tick.
 *
 * Not wired to a Vercel cron right now — `vercel.json` declares none — so
 * nothing calls this on a timer. Every job in the registry is `opportunistic`,
 * which means real traffic drives all of them through `maybeTick()`; this route
 * stays because the moment the shop is quiet enough that traffic is not enough,
 * adding one line back to `vercel.json` is the whole change.
 *
 * It runs with `force`, so a tick that happened a minute ago cannot talk it out
 * of running. It can also be hit by hand with the CRON_SECRET.
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
