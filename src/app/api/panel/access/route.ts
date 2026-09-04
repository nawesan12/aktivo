import { NextResponse } from "next/server";
import { getSessionBusiness, requireBusinessPermission } from "@/lib/auth/session-business";
import { handleApiError } from "@/lib/api-errors";
import { getBusinessAccess } from "@/lib/subscription/access";

/**
 * Trial and subscription state, and nothing else.
 *
 * Deliberately separate from `/api/panel/subscription`, which also counts staff
 * and appointments: this one is read by a banner on every panel page, so it has
 * to stay down to a couple of rows.
 */
export async function GET() {
  try {
    const session = await getSessionBusiness();
    await requireBusinessPermission(session, "billing:read");

    const access = await getBusinessAccess(session.businessId);

    return NextResponse.json({
      blocked: access.blocked,
      trialDaysLeft: access.trialDaysLeft,
      hasSubscription: access.hasSubscription,
    });
  } catch (error) {
    return handleApiError(error, "panel:access");
  }
}
