import { addDays } from "date-fns";
import { db } from "@/lib/db";
import { appUrl } from "@/lib/env";
import { createLogger } from "@/lib/logger";
import { sendReviewRequestEmail } from "@/lib/notifications/review-request-email";

const log = createLogger("reviews:requests");

/** A review link stops being useful long after the visit. */
const TOKEN_TTL_DAYS = 7;

/**
 * Beyond this, asking is pointless: the customer barely remembers the visit.
 * It also stops a first run from mailing months of back catalogue at once.
 */
const MAX_AGE_DAYS = 7;

/**
 * Asks for a review once a visit is old enough.
 *
 * `BusinessSettings.reviewRequestDelayHours` existed and was configurable in the
 * panel, but nothing honoured it: the request was only sent at the exact moment
 * a member of staff marked the appointment as completed — that is, while the
 * customer was often still in the shop. Any appointment completed some other
 * way never triggered a request at all.
 */
export async function sendPendingReviewRequests(limit = 100) {
  const now = new Date();
  const oldest = addDays(now, -MAX_AGE_DAYS);

  // One row per business, so it stays small. The delay is per-business, but
  // querying appointments once per business turned this into 1+N queries every
  // time the job ran, whether or not there was anything to send.
  const settings = await db.businessSettings.findMany({
    select: { businessId: true, reviewRequestDelayHours: true },
  });
  if (settings.length === 0) return { created: 0, sent: 0, failed: 0 };

  const delayByBusiness = new Map(
    settings.map((s) => [s.businessId, s.reviewRequestDelayHours])
  );

  // Fetch with the shortest delay any business configured, then drop the ones
  // whose own business wants to wait longer. One query instead of N.
  const shortestDelay = Math.min(...settings.map((s) => s.reviewRequestDelayHours));
  const readyBefore = new Date(now.getTime() - shortestDelay * 3_600_000);

  const candidates = await db.appointment.findMany({
    where: {
      businessId: { in: [...delayByBusiness.keys()] },
      status: "COMPLETED",
      dateTime: { lte: readyBefore, gte: oldest },
      // One token per appointment, and never ask someone who already replied.
      reviewToken: { is: null },
      review: { is: null },
    },
    include: {
      business: { select: { name: true } },
      service: { select: { name: true } },
      user: { select: { id: true, name: true, email: true } },
      guestClient: { select: { id: true, name: true, email: true } },
    },
    orderBy: { dateTime: "asc" },
    take: limit,
  });

  let created = 0;
  let sent = 0;
  let failed = 0;

  for (const appointment of candidates) {
    const delayHours = delayByBusiness.get(appointment.businessId);
    if (delayHours === undefined) continue;

    if (appointment.dateTime > new Date(now.getTime() - delayHours * 3_600_000)) {
      continue;
    }

    const client = appointment.user ?? appointment.guestClient;
    const email = client?.email ?? null;

    // Email is the only channel: without an address the token would be a dead row.
    if (!email) continue;

    try {
      // Inside the try on purpose. `appointmentId` is unique, so two overlapping
      // runs race here, and an escaping P2002 used to abort the whole pass —
      // every business still queued behind this one got nothing.
      const token = await db.reviewToken.create({
        data: {
          businessId: appointment.businessId,
          appointmentId: appointment.id,
          userId: appointment.userId,
          guestClientId: appointment.guestClientId,
          expiresAt: addDays(now, TOKEN_TTL_DAYS),
        },
      });
      created++;

      await sendReviewRequestEmail({
        to: email,
        clientName: client?.name || "Cliente",
        businessName: appointment.business.name,
        serviceName: appointment.service.name,
        reviewUrl: appUrl(`/review/${token.token}`),
      });
      sent++;
    } catch (error) {
      if (isUniqueViolation(error)) continue;

      failed++;
      log.warn("could not send a review request", {
        appointmentId: appointment.id,
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return { created, sent, failed };
}

/** Another run got to this appointment first. Not a failure, just a no-op. */
function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}
