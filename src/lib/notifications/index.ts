import { db } from "@/lib/db";
import { sendEmail } from "./email";

type NotificationType =
  | "confirmation"
  | "reminder"
  | "cancellation"
  | "reschedule"
  | "reminder_24h"
  | "reminder_1h";

interface NotificationData {
  businessId: string;
  businessName: string;
  appointmentId: string;
  clientName: string;
  clientEmail?: string;
  serviceName: string;
  staffName: string;
  dateTime: Date;
  type: NotificationType;
  /** User ID — used to check notification preferences */
  userId?: string | null;
  /** Guest client ID — used to check notification preferences */
  guestClientId?: string | null;
  /** Lets the mail carry a link back to the turno. See `EmailData`. */
  businessSlug?: string;
}

async function getPreferences(
  businessId: string,
  userId?: string | null,
  guestClientId?: string | null
) {
  if (!userId && !guestClientId) return null;

  const where = userId
    ? { businessId_userId: { businessId, userId } }
    : guestClientId
      ? { businessId_guestClientId: { businessId, guestClientId } }
      : null;

  if (!where) return null;

  return db.notificationPreference.findUnique({ where });
}

export async function sendNotification(data: NotificationData) {
  const results: Array<{ channel: string; success: boolean; error?: string }> = [];

  // Check notification preferences
  const prefs = await getPreferences(data.businessId, data.userId, data.guestClientId);

  const isReminder = data.type === "reminder_24h" || data.type === "reminder_1h" || data.type === "reminder";
  if (prefs?.remindersEnabled === false && isReminder) {
    return results;
  }

  const emailEnabled = prefs?.emailEnabled !== false;

  // Map extended types to the base types the email templates know about
  const baseType =
    data.type === "reminder_24h" || data.type === "reminder"
      ? ("reminder" as const)
      : data.type === "reminder_1h"
        ? ("reminder_soon" as const)
        : data.type === "reschedule"
          ? ("confirmation" as const)
          : data.type;

  if (data.clientEmail && emailEnabled) {
    try {
      await sendEmail({
        to: data.clientEmail,
        type: baseType,
        businessName: data.businessName,
        clientName: data.clientName,
        serviceName: data.serviceName,
        staffName: data.staffName,
        dateTime: data.dateTime,
        businessSlug: data.businessSlug,
      });

      await db.notification.create({
        data: {
          businessId: data.businessId,
          appointmentId: data.appointmentId,
          channel: "EMAIL",
          type: data.type,
          status: "SENT",
          recipient: data.clientEmail,
          sentAt: new Date(),
        },
      });

      results.push({ channel: "email", success: true });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";

      await db.notification.create({
        data: {
          businessId: data.businessId,
          appointmentId: data.appointmentId,
          channel: "EMAIL",
          type: data.type,
          status: "FAILED",
          recipient: data.clientEmail,
          error: errorMsg,
        },
      });

      results.push({ channel: "email", success: false, error: errorMsg });
    }
  }

  return results;
}
