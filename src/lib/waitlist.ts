import { db } from "@/lib/db";
import { sendWhatsAppText } from "@/lib/notifications/whatsapp";
import { sendEmail } from "@/lib/notifications/email";
import { addDays } from "date-fns";

/**
 * Notify waitlist entries when a slot opens (appointment cancelled/rescheduled).
 * Fire-and-forget — meant to be called with .catch(console.error).
 */
export async function notifyWaitlistOnCancellation({
  businessId,
  serviceId,
  staffId,
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
  const bookingUrl = `${process.env.NEXTAUTH_URL}/${businessSlug}/reservar`;

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

    // Send WhatsApp
    sendWhatsAppText(entry.phone, message).catch(console.error);

    // Send Email if available
    if (entry.email) {
      sendEmail({
        to: entry.email,
        type: "cancellation",
        businessName,
        clientName: entry.name,
        serviceName,
        staffName,
        dateTime,
      }).catch(console.error);
    }

    await db.waitlistEntry.update({
      where: { id: entry.id },
      data: { notified: true, notifiedAt: new Date() },
    });

    notifiedCount++;
  }

  return notifiedCount;
}
