import { db } from "@/lib/db";
import { sendWhatsApp } from "./whatsapp";
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
  clientPhone?: string;
  clientEmail?: string;
  serviceName: string;
  staffName: string;
  dateTime: Date;
  type: NotificationType;
  /** User ID — used to check notification preferences */
  userId?: string | null;
  /** Guest client ID — used to check notification preferences */
  guestClientId?: string | null;
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

  const whatsappEnabled = prefs?.whatsappEnabled !== false;
  const emailEnabled = prefs?.emailEnabled !== false;

  // Map extended types to base types for WhatsApp/Email
  const baseType = (data.type === "reminder_24h" || data.type === "reminder_1h")
    ? "reminder" as const
    : data.type === "reschedule"
      ? "confirmation" as const
      : data.type;

  // Send WhatsApp
  if (data.clientPhone && whatsappEnabled) {
    try {
      await sendWhatsApp({
        to: data.clientPhone,
        type: baseType,
        businessName: data.businessName,
        clientName: data.clientName,
        serviceName: data.serviceName,
        staffName: data.staffName,
        dateTime: data.dateTime,
      });

      await db.notification.create({
        data: {
          businessId: data.businessId,
          appointmentId: data.appointmentId,
          channel: "WHATSAPP",
          type: data.type,
          status: "SENT",
          recipient: data.clientPhone,
          sentAt: new Date(),
        },
      });

      results.push({ channel: "whatsapp", success: true });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";

      await db.notification.create({
        data: {
          businessId: data.businessId,
          appointmentId: data.appointmentId,
          channel: "WHATSAPP",
          type: data.type,
          status: "FAILED",
          recipient: data.clientPhone,
          error: errorMsg,
        },
      });

      results.push({ channel: "whatsapp", success: false, error: errorMsg });
    }
  }

  // Send Email
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
