import { db } from "@/lib/db";
import { sendWhatsApp } from "./whatsapp";
import { sendEmail } from "./email";

type NotificationType = "confirmation" | "reminder" | "cancellation";

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
}

export async function sendNotification(data: NotificationData) {
  const results: Array<{ channel: string; success: boolean; error?: string }> = [];

  // Send WhatsApp
  if (data.clientPhone) {
    try {
      await sendWhatsApp({
        to: data.clientPhone,
        type: data.type,
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
  if (data.clientEmail) {
    try {
      await sendEmail({
        to: data.clientEmail,
        type: data.type,
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
