import { NextRequest, NextResponse } from "next/server";
import { assertCronRequest } from "@/lib/cron-auth";
import { handleApiError } from "@/lib/api-errors";
import { createLogger } from "@/lib/logger";
import { sendPendingReviewRequests } from "@/lib/reviews/requests";

const log = createLogger("cron:review-requests");

/**
 * Hourly pass that asks for reviews once each visit is old enough, honouring
 * every business's own `reviewRequestDelayHours`.
 */
export async function GET(request: NextRequest) {
  try {
    assertCronRequest(request);

    const result = await sendPendingReviewRequests();

    if (result.created > 0) {
      log.info("review requests sent", result);
    }

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error, "cron:review-requests");
  }
}
