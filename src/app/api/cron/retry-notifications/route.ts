import { NextRequest, NextResponse } from "next/server";
import { assertCronRequest } from "@/lib/cron-auth";
import { handleApiError } from "@/lib/api-errors";
import { createLogger } from "@/lib/logger";
import { redeliverFailedNotifications } from "@/lib/notifications/redelivery";

const log = createLogger("cron:retry-notifications");

/**
 * Retries the notifications that failed to be delivered.
 *
 * The `Notification` table has always recorded failures; nothing ever read them
 * back. A confirmation lost to a transient Meta error stayed lost, and the
 * customer only found out by showing up — or by not showing up.
 */
export async function GET(request: NextRequest) {
  try {
    assertCronRequest(request);

    const result = await redeliverFailedNotifications();

    if (result.considered > 0) {
      log.info("redelivery pass finished", result);
    }

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error, "cron:retry-notifications");
  }
}
