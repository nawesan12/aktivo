import { db } from "@/lib/db";
import { sendWhatsAppText } from "@/lib/notifications/whatsapp";
import { sendEmail } from "@/lib/notifications/email";
import { addDays } from "date-fns";
import { appUrl } from "@/lib/env";
import { createLogger } from "@/lib/logger";

const log = createLogger("waitlist");

/**
 * Notify waitlist entries when a slot opens (appointment cancelled/rescheduled).
 *
 * Call it through `runInBackground`: the caller should not wait for it, but the
 * sends themselves are awaited here. They used to be fired and forgotten while
 * the entry was marked `notified: true` regardless — so a failed send burned the
 * person's place in the queue without telling anyone.
 */
export async function notifyWaitlistOnCancellation({
  businessId,
  serviceId,
  dateTime,
  businessName,
  businessSlug,
  serviceName,
  staffName,
}: {
  businessId: string;
  serviceId: string;
  staffId?: string;
  dateTime: Date;
  businessName: string;
  businessSlug: string;
  serviceName: string;
  staffName: string;
}): Promise<number> {
  const bookingUrl = appUrl(`/${businessSlug}/reservar`);

  // Find matching waitlist entries: same service, date ±1 day, not notified, not expired
  const entries = await db.waitlistEntry.findMany({
    where: {
      businessId,
      serviceId,
      notified: false,
      expiresAt: { gt: new Date() },
      preferredDate: {
        gte: addDays(dateTime, -1),
        lte: addDays(dateTime, 1),
      },
    },
    take: 5,
  });

  let notifiedCount = 0;

  for (const entry of entries) {
    const message = `¡Buenas noticias! Se liberó un turno para ${serviceName} el ${dateTime.toLocaleDateString("es-AR")} con ${staffName}. Reservá ahora: ${bookingUrl}`;

    const delivered = await Promise.allSettled([
      sendWhatsAppText(entry.phone, message),
      ...(entry.email
        ? [
            sendEmail({
              to: entry.email,
              type: "cancellation",
              businessName,
              clientName: entry.name,
              serviceName,
              staffName,
              dateTime,
            }),
          ]
        : []),
    ]);

    const reached = delivered.some((r) => r.status === "fulfilled");
    for (const result of delivered) {
      if (result.status === "rejected") {
        log.error("could not notify a waitlist entry", result.reason, {
          entryId: entry.id,
        });
      }
    }

    // Only burn the entry if we actually reached the person.
    if (!reached) continue;

    await db.waitlistEntry.update({
      where: { id: entry.id },
      data: { notified: true, notifiedAt: new Date() },
    });

    notifiedCount++;
  }

  return notifiedCount;
}
