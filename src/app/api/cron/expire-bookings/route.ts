import { NextRequest, NextResponse } from "next/server";
import { assertCronRequest } from "@/lib/cron-auth";
import { handleApiError } from "@/lib/api-errors";
import { releaseExpiredHolds } from "@/lib/bookings/expiry";

/**
 * Platform-wide sweep of unpaid bookings.
 *
 * The real defence lives inline in the booking paths (see
 * `releaseExpiredHolds`), which is what guarantees a slot is never permanently
 * dead. This endpoint is the safety net for the rest: holds nobody tried to
 * rebook still have to disappear, or the owner's agenda shows appointments that
 * are not going to happen.
 */
export async function GET(request: NextRequest) {
  try {
    assertCronRequest(request);

    const { released } = await releaseExpiredHolds({}, 500);

    return NextResponse.json({ expired: released });
  } catch (error) {
    return handleApiError(error);
  }
}
