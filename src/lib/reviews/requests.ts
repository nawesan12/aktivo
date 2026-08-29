import { addDays } from "date-fns";
import { db } from "@/lib/db";
import { appUrl } from "@/lib/env";
import { createLogger } from "@/lib/logger";
import { sendReviewRequestEmail } from "@/lib/notifications/review-request-email";
import { sendWhatsApp } from "@/lib/notifications/whatsapp";

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

  const settings = await db.businessSettings.findMany({
    select: { businessId: true, reviewRequestDelayHours: true },
  });

  let created = 0;
  let sent = 0;
  let failed = 0;

  for (const { businessId, reviewRequestDelayHours } of settings) {
    const readyBefore = new Date(now.getTime() - reviewRequestDelayHours * 3_600_000);

    const appointments = await db.appointment.findMany({
      where: {
        businessId,
        status: "COMPLETED",
        dateTime: { lte: readyBefore, gte: oldest },
        // One token per appointment, and never ask someone who already replied.
        reviewToken: { is: null },
        review: { is: null },
      },
      include: {
        business: { select: { name: true } },
        service: { select: { name: true } },
        staff: { select: { name: true } },
        user: { select: { id: true, name: true, email: true, phone: true } },
        guestClient: { select: { id: true, name: true, email: true, phone: true } },
      },
      take: limit,
    });

    for (const appointment of appointments) {
      const client = appointment.user ?? appointment.guestClient;
      const email = client?.email ?? null;
      const phone = client?.phone ?? null;

      // No way to reach them: creating a token would only leave dead rows.
      if (!email && !phone) continue;

      const token = await db.reviewToken.create({
        data: {
          businessId,
          appointmentId: appointment.id,
          userId: appointment.userId,
          guestClientId: appointment.guestClientId,
          expiresAt: addDays(now, TOKEN_TTL_DAYS),
        },
      });
      created++;

      const reviewUrl = appUrl(`/review/${token.token}`);
      const clientName = client?.name || "Cliente";

      try {
        if (email) {
          await sendReviewRequestEmail({
            to: email,
            clientName,
            businessName: appointment.business.name,
            serviceName: appointment.service.name,
            reviewUrl,
          });
        } else if (phone) {
          await sendWhatsApp({
            to: phone,
            type: "review_request",
            businessName: appointment.business.name,
            clientName,
            serviceName: appointment.service.name,
            staffName: appointment.staff.name,
            dateTime: appointment.dateTime,
            bookingUrl: reviewUrl,
          });
        }
        sent++;
      } catch (error) {
        failed++;
        log.warn("could not send a review request", {
          appointmentId: appointment.id,
          reason: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  return { created, sent, failed };
}
