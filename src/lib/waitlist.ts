import { db } from "@/lib/db";
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
    // Email is the only channel. An entry without one cannot be reached, and
    // burning it would silently drop the person from the queue.
    if (!entry.email) {
      log.warn("waitlist entry has no email, cannot notify", { entryId: entry.id });
      continue;
    }

    try {
      await sendEmail({
        to: entry.email,
        type: "waitlist_slot_open",
        businessName,
        clientName: entry.name,
        serviceName,
        staffName,
        dateTime,
        bookingUrl,
      });
    } catch (error) {
      log.error("could not notify a waitlist entry", error, { entryId: entry.id });
      continue;
    }

    await db.waitlistEntry.update({
      where: { id: entry.id },
      data: { notified: true, notifiedAt: new Date() },
    });

    notifiedCount++;
  }

  return notifiedCount;
}
