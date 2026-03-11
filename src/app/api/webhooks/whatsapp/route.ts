import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  verifyWebhookSignature,
  markAsRead,
  type WhatsAppWebhookEntry,
  type WhatsAppWebhookMessage,
  type WhatsAppWebhookStatus,
} from "@/lib/notifications/whatsapp";

// ─── GET: Webhook verification (Meta challenge) ──────────────────────────────

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === "subscribe" && token === verifyToken) {
    console.log("[WhatsApp Webhook] Verification successful");
    return new NextResponse(challenge, { status: 200 });
  }

  console.warn("[WhatsApp Webhook] Verification failed", { mode, token: token?.slice(0, 8) });
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// ─── POST: Incoming messages & status updates ────────────────────────────────

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  // Verify signature if app secret is configured
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (appSecret) {
    const signature = req.headers.get("x-hub-signature-256") || "";
    if (!verifyWebhookSignature(rawBody, signature, appSecret)) {
      console.warn("[WhatsApp Webhook] Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  let payload: { object: string; entry: WhatsAppWebhookEntry[] };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (payload.object !== "whatsapp_business_account") {
    return NextResponse.json({ error: "Unknown object" }, { status: 400 });
  }

  // Process each entry
  for (const entry of payload.entry) {
    for (const change of entry.changes) {
      const value = change.value;

      // Handle incoming messages
      if (value.messages) {
        for (const message of value.messages) {
          await handleIncomingMessage(message, value.metadata.phone_number_id);
        }
      }

      // Handle status updates (sent, delivered, read, failed)
      if (value.statuses) {
        for (const status of value.statuses) {
          await handleStatusUpdate(status);
        }
      }
    }
  }

  // Always return 200 quickly to acknowledge
  return NextResponse.json({ status: "ok" });
}

// ─── Handle incoming messages ────────────────────────────────────────────────

async function handleIncomingMessage(
  message: WhatsAppWebhookMessage,
  phoneNumberId: string
) {
  console.log(`[WhatsApp] Incoming ${message.type} from ${message.from}: ${JSON.stringify(message)}`);

  // Auto-mark as read
  try {
    await markAsRead(message.id);
  } catch {
    // Non-critical, continue
  }

  // Handle interactive button replies (confirm_ok, cancel_request, review_*)
  if (message.type === "interactive" && message.interactive?.button_reply) {
    const buttonId = message.interactive.button_reply.id;
    const senderPhone = message.from;

    if (buttonId === "cancel_request") {
      await handleCancellationRequest(senderPhone);
    } else if (buttonId.startsWith("review_")) {
      const rating = parseInt(buttonId.replace("review_", ""), 10);
      if (rating >= 1 && rating <= 5) {
        await handleReviewRating(senderPhone, rating);
      }
    }
    // "confirm_ok" and "reminder_ok" are just acknowledgements, no action needed
  }

  // Handle text messages — future: conversational booking bot
  if (message.type === "text" && message.text?.body) {
    const text = message.text.body.toLowerCase().trim();

    // Simple keyword triggers
    if (text === "hola" || text === "reservar" || text === "turno") {
      console.log(`[WhatsApp] Booking intent from ${message.from} — bot not yet implemented`);
      // Future: trigger conversational booking flow
    }
  }
}

// ─── Handle status updates ───────────────────────────────────────────────────

async function handleStatusUpdate(status: WhatsAppWebhookStatus) {
  // Map Meta statuses to our notification statuses
  const statusMap: Record<string, string> = {
    sent: "SENT",
    delivered: "SENT", // We treat delivered as sent
    read: "SENT",
    failed: "FAILED",
  };

  const ourStatus = statusMap[status.status];
  if (!ourStatus) return;

  // Update notification record if we can find it by message ID
  // The messageId from sendWhatsApp is stored... but we don't have a column for it yet.
  // For now, just log.
  if (status.status === "failed") {
    const errorMsg = status.errors?.map((e) => `${e.code}: ${e.title}`).join(", ") || "Unknown";
    console.error(`[WhatsApp] Message ${status.id} failed: ${errorMsg}`);
  }
}

// ─── Cancellation request handler ────────────────────────────────────────────

async function handleCancellationRequest(phone: string) {
  // Find the most recent upcoming appointment for this phone number
  const normalizedPhone = phone.replace(/\D/g, "");

  const guestClient = await db.guestClient.findFirst({
    where: {
      phone: { contains: normalizedPhone.slice(-10) },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!guestClient) {
    console.log(`[WhatsApp] Cancel request from unknown phone: ${phone}`);
    return;
  }

  const appointment = await db.appointment.findFirst({
    where: {
      guestClientId: guestClient.id,
      status: { in: ["CONFIRMED", "PENDING"] },
      dateTime: { gte: new Date() },
    },
    orderBy: { dateTime: "asc" },
    include: { business: { select: { id: true, name: true } } },
  });

  if (!appointment) {
    console.log(`[WhatsApp] No upcoming appointment found for phone: ${phone}`);
    return;
  }

  // Cancel the appointment
  await db.appointment.update({
    where: { id: appointment.id },
    data: { status: "CANCELLED" },
  });

  console.log(`[WhatsApp] Appointment ${appointment.id} cancelled via WhatsApp by ${phone}`);

  // Log the action
  await db.auditLog.create({
    data: {
      businessId: appointment.business.id,
      action: "APPOINTMENT_CANCELLED",
      entity: "appointment",
      entityId: appointment.id,
      details: { method: "whatsapp_button", phone },
    },
  });
}

// ─── Review rating handler ───────────────────────────────────────────────────

async function handleReviewRating(phone: string, rating: number) {
  const normalizedPhone = phone.replace(/\D/g, "");

  // Find guest client
  const guestClient = await db.guestClient.findFirst({
    where: {
      phone: { contains: normalizedPhone.slice(-10) },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!guestClient) return;

  // Find the most recent completed appointment
  const appointment = await db.appointment.findFirst({
    where: {
      guestClientId: guestClient.id,
      status: "COMPLETED",
    },
    orderBy: { dateTime: "desc" },
    include: {
      business: { select: { id: true } },
    },
  });

  if (!appointment) return;

  // Check if review already exists
  const existing = await db.review.findFirst({
    where: {
      businessId: appointment.business.id,
      guestClientId: guestClient.id,
      appointmentId: appointment.id,
    },
  });

  if (existing) return;

  await db.review.create({
    data: {
      businessId: appointment.business.id,
      guestClientId: guestClient.id,
      appointmentId: appointment.id,
      rating,
      comment: null,
      isVisible: true,
    },
  });

  console.log(`[WhatsApp] Review created: ${rating} stars from ${phone}`);
}
