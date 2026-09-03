import { NextRequest, NextResponse } from "next/server";
import { autoMarkNoShows } from "@/lib/no-show";
import { assertCronRequest } from "@/lib/cron-auth";
import { handleApiError } from "@/lib/api-errors";

/**
 * Manual entry point for the no-show job. The scheduling lives in
 * `src/lib/jobs`; this stays for on-demand runs and debugging.
 */
export async function GET(request: NextRequest) {
  try {
    assertCronRequest(request);

    return NextResponse.json(await autoMarkNoShows());
  } catch (error) {
    return handleApiError(error);
  }
}
