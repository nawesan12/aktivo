import { db } from "@/lib/db";

/**
 * Record a no-show for a client and check if penalties should be applied.
 */
export async function recordNoShow({
  businessId,
  appointmentId,
  userId,
  guestClientId,
}: {
  businessId: string;
  appointmentId: string;
  userId?: string | null;
  guestClientId?: string | null;
}) {
  // Mark appointment as NO_SHOW
  await db.appointment.update({
    where: { id: appointmentId },
    data: { status: "NO_SHOW" },
  });

  // Get business settings for threshold
  const settings = await db.businessSettings.findUnique({
    where: { businessId },
  });

  if (!settings) return { penalized: false };

  const threshold = settings.noShowThreshold;
  const penaltyDays = settings.noShowPenaltyDays;

  // Count recent no-shows (last 90 days)
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const where: Record<string, unknown> = {
    businessId,
    status: "NO_SHOW",
    dateTime: { gte: ninetyDaysAgo },
  };

  if (userId) where.userId = userId;
  else if (guestClientId) where.guestClientId = guestClientId;

  const noShowCount = await db.appointment.count({ where });

  // Apply penalty if threshold exceeded
  if (noShowCount >= threshold) {
    const blockedUntil = new Date();
    blockedUntil.setDate(blockedUntil.getDate() + penaltyDays);

    await db.clientPenalty.create({
      data: {
        businessId,
        userId: userId || undefined,
        guestClientId: guestClientId || undefined,
        reason: "NO_SHOW",
        blockedUntil,
      },
    });

    return { penalized: true, blockedUntil, noShowCount };
  }

  return { penalized: false, noShowCount };
}

/**
 * Check if a client has active penalties for a business.
 */
export async function checkPenalty({
  businessId,
  userId,
  guestClientId,
}: {
  businessId: string;
  userId?: string | null;
  guestClientId?: string | null;
}): Promise<{ blocked: boolean; until?: Date }> {
  if (!userId && !guestClientId) return { blocked: false };

  const where: Record<string, unknown> = {
    businessId,
    blockedUntil: { gt: new Date() },
    liftedAt: null,
  };

  if (userId) where.userId = userId;
  else if (guestClientId) where.guestClientId = guestClientId;

  const penalty = await db.clientPenalty.findFirst({
    where,
    orderBy: { blockedUntil: "desc" },
  });

  if (penalty) {
    return { blocked: true, until: penalty.blockedUntil };
  }

  return { blocked: false };
}

/**
 * Lift a penalty early (admin action).
 */
export async function liftPenalty(penaltyId: string, liftedBy: string) {
  return db.clientPenalty.update({
    where: { id: penaltyId },
    data: { liftedAt: new Date(), liftedBy },
  });
}

/**
 * Get no-show statistics for a business.
 */
export async function getNoShowStats(businessId: string) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [totalNoShows, recentNoShows, activePenalties, repeatOffenders] = await Promise.all([
    db.appointment.count({
      where: { businessId, status: "NO_SHOW" },
    }),
    db.appointment.count({
      where: { businessId, status: "NO_SHOW", dateTime: { gte: thirtyDaysAgo } },
    }),
    db.clientPenalty.count({
      where: { businessId, blockedUntil: { gt: new Date() }, liftedAt: null },
    }),
    // Find clients with 2+ no-shows in last 90 days
    db.appointment.groupBy({
      by: ["userId", "guestClientId"],
      where: {
        businessId,
        status: "NO_SHOW",
        dateTime: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
      },
      _count: { id: true },
      having: { id: { _count: { gte: 2 } } },
    }),
  ]);

  return {
    totalNoShows,
    recentNoShows,
    activePenalties,
    repeatOffenderCount: repeatOffenders.length,
  };
}
