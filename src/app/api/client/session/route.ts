import { NextResponse } from "next/server";

import { handleApiError } from "@/lib/api-errors";
import { resolveClientIdentity } from "@/lib/client-identity";

/**
 * Whether this browser already knows whose appointments to show.
 *
 * Answers 200 either way. The portal used to find out by requesting the
 * appointments themselves and reading a 401, which put a red error in the
 * console of every visitor who simply had not booked yet.
 */
export async function GET() {
  try {
    const identity = await resolveClientIdentity();
    return NextResponse.json({
      identified: Boolean(identity),
      email: identity?.email ?? null,
      via: identity?.via ?? null,
    });
  } catch (error) {
    return handleApiError(error, "client:session");
  }
}
