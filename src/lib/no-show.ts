import { db } from "@/lib/db";
import { createLogger } from "@/lib/logger";

const log = createLogger("no-show");

/** Only the two fields the penalty decision needs. */
interface PenaltySettings {
  noShowThreshold: number;
  noShowPenaltyDays: number;
}

/**
 * Record a no-show for a client and check if penalties should be applied.
 *
 * `settings` can be passed in by a caller that already has it. The batch job
 * marks up to 200 appointments in one pass, and looking the same business's
 * settings up once per appointment was most of its query budget.
 */
export async function recordNoShow({
  businessId,
  appointmentId,
  userId,
  guestClientId,
  settings: providedSettings,
}: {
  businessId: string;
  appointmentId: string;
  userId?: string | null;
  guestClientId?: string | null;
  settings?: PenaltySettings | null;
}) {
  // Mark appointment as NO_SHOW
  await db.appointment.update({
    where: { id: appointmentId },
    data: { status: "NO_SHOW" },
  });

  const settings =
    providedSettings !== undefined
      ? providedSettings
      : await db.businessSettings.findUnique({ where: { businessId } });

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

/**
 * Marks appointments nobody closed as NO_SHOW.
 *
 * Only for businesses that opted in (`BusinessSettings.noShowAutoMark`). An
 * appointment qualifies once it ended more than GRACE_MINUTES ago and nobody
 * marked it completed — the grace exists so a staff member who closes the
 * appointment a bit late doesn't get their client penalised.
 */
const GRACE_MINUTES = 120;
const BATCH_SIZE = 200;

export interface NoShowRunResult {
  marked: number;
  penalized: number;
  saturated: boolean;
}

export async function autoMarkNoShows(): Promise<NoShowRunResult> {
  const cutoff = new Date(Date.now() - GRACE_MINUTES * 60 * 1000);

  const candidates = await db.appointment.findMany({
    where: {
      status: { in: ["PENDING", "CONFIRMED"] },
      endTime: { lt: cutoff },
      business: { settings: { noShowAutoMark: true } },
    },
    select: {
      id: true,
      businessId: true,
      userId: true,
      guestClientId: true,
    },
    orderBy: { endTime: "asc" },
    take: BATCH_SIZE,
  });

  if (candidates.length === 0) {
    return { marked: 0, penalized: 0, saturated: false };
  }

  // One lookup per business instead of one per appointment.
  const businessIds = [...new Set(candidates.map((a) => a.businessId))];
  const settingsRows = await db.businessSettings.findMany({
    where: { businessId: { in: businessIds } },
    select: {
      businessId: true,
      noShowThreshold: true,
      noShowPenaltyDays: true,
    },
  });
  const settingsByBusiness = new Map(settingsRows.map((s) => [s.businessId, s]));

  let marked = 0;
  let penalized = 0;

  for (const appointment of candidates) {
    try {
      const result = await recordNoShow({
        businessId: appointment.businessId,
        appointmentId: appointment.id,
        userId: appointment.userId,
        guestClientId: appointment.guestClientId,
        settings: settingsByBusiness.get(appointment.businessId) ?? null,
      });
      marked++;
      if (result.penalized) penalized++;
    } catch (error) {
      log.error("could not mark as no-show", error, { appointmentId: appointment.id });
    }
  }

  return { marked, penalized, saturated: candidates.length === BATCH_SIZE };
}
