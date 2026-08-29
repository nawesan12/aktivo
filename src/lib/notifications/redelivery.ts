import { db } from "@/lib/db";
import { sendWhatsApp } from "./whatsapp";
import { sendEmail } from "./email";
import { createLogger } from "@/lib/logger";

const log = createLogger("notifications:redelivery");

/**
 * Re-sends notifications that failed.
 *
 * `sendNotification` already records every failure as a row with
 * `status: FAILED` — but nothing ever read those rows back, so a WhatsApp lost
 * to a Meta hiccup was lost for good, and the customer simply never got their
 * confirmation. This closes that loop.
 */

/** After this many tries the recipient is assumed to be wrong, not unlucky. */
export const MAX_ATTEMPTS = 4;

/** Older than this, a reminder for a past appointment is noise, not a fix. */
const MAX_AGE_HOURS = 24;

type BaseType = "confirmation" | "reminder" | "cancellation";

function toBaseType(type: string): BaseType {
  if (type.startsWith("reminder")) return "reminder";
  if (type === "cancellation") return "cancellation";
  return "confirmation";
}

export async function redeliverFailedNotifications(limit = 50) {
  const since = new Date(Date.now() - MAX_AGE_HOURS * 60 * 60 * 1000);

  const pending = await db.notification.findMany({
    where: {
      status: "FAILED",
      attempts: { lt: MAX_ATTEMPTS },
      createdAt: { gte: since },
      // Without the appointment there is nothing to rebuild the message from.
      appointmentId: { not: null },
    },
    include: {
      business: { select: { name: true } },
      appointment: {
        include: {
          service: { select: { name: true } },
          staff: { select: { name: true } },
          user: { select: { name: true } },
          guestClient: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  let sent = 0;
  let failed = 0;
  let abandoned = 0;

  for (const notification of pending) {
    const appointment = notification.appointment;

    // The appointment was deleted, or is no longer worth notifying about.
    if (!appointment || appointment.status === "CANCELLED") {
      await db.notification.update({
        where: { id: notification.id },
        data: { attempts: MAX_ATTEMPTS, lastAttemptAt: new Date() },
      });
      abandoned++;
      continue;
    }

    const clientName =
      appointment.user?.name || appointment.guestClient?.name || "Cliente";

    try {
      const payload = {
        to: notification.recipient,
        type: toBaseType(notification.type),
        businessName: notification.business.name,
        clientName,
        serviceName: appointment.service.name,
        staffName: appointment.staff.name,
        dateTime: appointment.dateTime,
      };

      if (notification.channel === "WHATSAPP") {
        await sendWhatsApp(payload);
      } else {
        await sendEmail(payload);
      }

      await db.notification.update({
        where: { id: notification.id },
        data: {
          status: "SENT",
          sentAt: new Date(),
          error: null,
          attempts: { increment: 1 },
          lastAttemptAt: new Date(),
        },
      });
      sent++;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      await db.notification.update({
        where: { id: notification.id },
        data: {
          error: message,
          attempts: { increment: 1 },
          lastAttemptAt: new Date(),
        },
      });
      log.warn("redelivery failed", {
        notificationId: notification.id,
        channel: notification.channel,
        attempt: notification.attempts + 1,
        reason: message,
      });
      failed++;
    }
  }

  return { considered: pending.length, sent, failed, abandoned };
}
