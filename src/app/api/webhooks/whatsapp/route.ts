import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  verifyWebhookSignature,
  markAsRead,
  type WhatsAppWebhookEntry,
  type WhatsAppWebhookMessage,
  type WhatsAppWebhookStatus,
} from "@/lib/notifications/whatsapp";
import { env } from "@/lib/env";
import { createLogger } from "@/lib/logger";
import { phoneLookupVariants } from "@/lib/phone";

const log = createLogger("webhook:whatsapp");

// ─── GET: Webhook verification (Meta challenge) ──────────────────────────────

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = env.WHATSAPP_VERIFY_TOKEN;

  if (mode === "subscribe" && token === verifyToken) {
    log.info("verification succeeded");
    return new NextResponse(challenge, { status: 200 });
  }

  log.warn("verification failed", { mode, tokenPrefix: token?.slice(0, 8) });
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// ─── POST: Incoming messages & status updates ────────────────────────────────

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  // Fail closed: without a configured secret every request would be trusted, and
  // this endpoint can cancel bookings and post reviews. No secret, no service.
  const appSecret = env.WHATSAPP_APP_SECRET;
  if (!appSecret) {
    log.error("WHATSAPP_APP_SECRET is not set — rejecting request");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const signature = req.headers.get("x-hub-signature-256") || "";
  if (!verifyWebhookSignature(rawBody, signature, appSecret)) {
    log.warn("invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
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
  log.debug("incoming message", { type: message.type, from: message.from });

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
      log.info("booking intent received, bot not implemented", { from: message.from });
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
    log.error("message delivery failed", undefined, { messageId: status.id, reason: errorMsg });
  }
}

// ─── Cancellation request handler ────────────────────────────────────────────

async function handleCancellationRequest(phone: string) {
  // Exact match against the forms the number may be stored in. The same phone
  // can exist as a guest of several businesses, so all of them are considered
  // and the soonest upcoming booking wins — deterministic, unlike picking one
  // at random.
  const guestClients = await db.guestClient.findMany({
    where: { phone: { in: phoneLookupVariants(phone) } },
    select: { id: true },
  });

  if (guestClients.length === 0) {
    log.info("cancellation request from unknown phone", { phone });
    return;
  }

  const appointment = await db.appointment.findFirst({
    where: {
      guestClientId: { in: guestClients.map((g) => g.id) },
      status: { in: ["CONFIRMED", "PENDING"] },
      dateTime: { gte: new Date() },
    },
    orderBy: { dateTime: "asc" },
    include: { business: { select: { id: true, name: true } } },
  });

  if (!appointment) {
    log.info("cancellation request with no upcoming appointment", { phone });
    return;
  }

  // Cancel the appointment
  await db.appointment.update({
    where: { id: appointment.id },
    data: { status: "CANCELLED" },
  });

  log.info("appointment cancelled via WhatsApp", { appointmentId: appointment.id, phone });

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
  // Exact match against the known stored forms. `contains` could land on a
  // different customer whose number merely includes these digits — and then
  // post a review in their name.
  const guestClient = await db.guestClient.findFirst({
    where: { phone: { in: phoneLookupVariants(phone) } },
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

  log.info("review created via WhatsApp", { rating, phone });
}
