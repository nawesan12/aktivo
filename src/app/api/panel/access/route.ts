import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionBusiness, requireBusinessPermission } from "@/lib/auth/session-business";
import { handleApiError } from "@/lib/api-errors";
import { getBusinessAccess } from "@/lib/subscription/access";
import { getPlanForBusiness } from "@/lib/subscription/enforcement";
import { PLAN_LIMITS } from "@/lib/subscription/config";

/**
 * Everything the panel's chrome needs, in one request.
 *
 * The sidebar, the trial banner and the branch switcher are on every panel
 * page, and each of them had grown its own fetch: `/api/panel/settings` for the
 * shop's name (which reads the whole business row and its settings, to print
 * two words), `/api/panel/waitlist` for a badge, `/api/panel/group` for a
 * switcher that most accounts never see because they have one location. Five
 * round trips of chrome before a single number of the screen itself.
 *
 * They all read this now. Still deliberately separate from
 * `/api/panel/subscription`, which counts staff and appointments and has no
 * business running on every page.
 */
export async function GET() {
  try {
    const session = await getSessionBusiness();
    await requireBusinessPermission(session, "billing:read");

    const [access, plan, business, waitlistPending] = await Promise.all([
      getBusinessAccess(session.businessId),
      getPlanForBusiness(session.businessId),
      db.business.findUnique({
        where: { id: session.businessId },
        select: { id: true, name: true, slug: true, city: true, groupId: true },
      }),
      // Only the ones still waiting on somebody: already notified or expired
      // entries are not a number anybody has to act on.
      db.waitlistEntry.count({
        where: {
          businessId: session.businessId,
          notified: false,
          expiresAt: { gt: new Date() },
        },
      }),
    ]);

    return NextResponse.json({
      blocked: access.blocked,
      trialDaysLeft: access.trialDaysLeft,
      hasSubscription: access.hasSubscription,
      // The panel gates whole screens on this. Reading it from here rather than
      // from /api/panel/subscription keeps those screens off an endpoint that
      // also counts staff and appointments.
      plan,
      features: PLAN_LIMITS[plan],
      business: business
        ? { id: business.id, name: business.name, slug: business.slug, city: business.city }
        : null,
      // The switcher only asks for the list of branches when it is opened, and
      // only when there is a group to list.
      hasGroup: Boolean(business?.groupId),
      waitlistPending,
    });
  } catch (error) {
    return handleApiError(error, "panel:access");
  }
}
