import { createHmac, timingSafeEqual } from "crypto";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toArgentinaDate } from "@/lib/timezone";
import { env } from "@/lib/env";
import { createLogger } from "@/lib/logger";
import { withRetry } from "@/lib/retry";
import { toWhatsAppFormat } from "@/lib/phone";

const log = createLogger("whatsapp");

// ─── Meta WhatsApp Cloud API ──────────────────────────────────────────────────
// Docs: https://developers.facebook.com/docs/whatsapp/cloud-api
//
// Environment variables (platform-level defaults):
//   WHATSAPP_PHONE_NUMBER_ID  — The phone number ID from Meta Business
//   WHATSAPP_ACCESS_TOKEN     — Permanent or system-user access token
//   WHATSAPP_VERIFY_TOKEN     — Webhook verification token (for GET challenge)
//
// Per-business overrides can be stored in BusinessConfig:
//   key: "whatsapp_phone_number_id" / "whatsapp_access_token"
// ───────────────────────────────────────────────────────────────────────────────

const API_VERSION = "v21.0";
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;

interface WhatsAppConfig {
  phoneNumberId: string;
  accessToken: string;
}

function getDefaultConfig(): WhatsAppConfig | null {
  const phoneNumberId = env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = env.WHATSAPP_ACCESS_TOKEN;
  if (!phoneNumberId || !accessToken) return null;
  return { phoneNumberId, accessToken };
}

// ─── Core send function ───────────────────────────────────────────────────────

/**
 * A send is retried up to three times with backoff. Meta's API throttles and
 * returns 5xx often enough that a single attempt loses real messages, and a
 * booking confirmation that never arrives is a customer at the wrong time.
 *
 * The status code travels on the error so `withRetry` can tell a throttle from
 * a malformed request — repeating a 400 only burns the remaining attempts.
 */
async function sendRequest(
  config: WhatsAppConfig,
  body: Record<string, unknown>
): Promise<{ messageId: string }> {
  const url = `${BASE_URL}/${config.phoneNumberId}/messages`;

  return withRetry(
    async () => {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          ...body,
        }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        const msg = error?.error?.message || `HTTP ${res.status}`;
        throw Object.assign(new Error(`WhatsApp API error: ${msg}`), {
          status: res.status,
        });
      }

      const data = await res.json();
      return { messageId: data.messages?.[0]?.id || "" };
    },
    { scope: "whatsapp:send", attempts: 3 }
  );
}

// ─── Phone number formatting ──────────────────────────────────────────────────

// Kept as a local name; the rules live in @/lib/phone, shared with validation.
const formatPhone = toWhatsAppFormat;

// ─── Message types ────────────────────────────────────────────────────────────

export interface WhatsAppMessage {
  to: string;
  type: "confirmation" | "reminder" | "cancellation" | "review_request" | "campaign";
  businessName: string;
  clientName: string;
  serviceName: string;
  staffName: string;
  dateTime: Date;
  /** Optional: used for interactive buttons */
  bookingUrl?: string;
  /** Optional: custom body for campaigns */
  campaignBody?: string;
  /** Optional: per-business WABA config override */
  config?: WhatsAppConfig;
}

function buildConfirmation(data: WhatsAppMessage, dateStr: string, timeStr: string) {
  return {
    to: formatPhone(data.to),
    type: "interactive",
    interactive: {
      type: "button",
      header: {
        type: "text",
        text: `✅ Turno Confirmado`,
      },
      body: {
        text: [
          `Hola ${data.clientName}! Tu turno en *${data.businessName}* fue confirmado.`,
          ``,
          `📋 *Servicio:* ${data.serviceName}`,
          `👤 *Profesional:* ${data.staffName}`,
          `📅 *Fecha:* ${dateStr}`,
          `🕐 *Hora:* ${timeStr}`,
          ``,
          `Te esperamos!`,
        ].join("\n"),
      },
      action: {
        buttons: [
          ...(data.bookingUrl
            ? []
            : []),
          {
            type: "reply",
            reply: { id: "confirm_ok", title: "Confirmar" },
          },
          {
            type: "reply",
            reply: { id: "cancel_request", title: "Cancelar turno" },
          },
        ],
      },
    },
  };
}

function buildReminder(data: WhatsAppMessage, dateStr: string, timeStr: string) {
  return {
    to: formatPhone(data.to),
    type: "interactive",
    interactive: {
      type: "button",
      header: {
        type: "text",
        text: `⏰ Recordatorio de Turno`,
      },
      body: {
        text: [
          `Hola ${data.clientName}! Te recordamos que mañana tenés turno en *${data.businessName}*.`,
          ``,
          `📋 *Servicio:* ${data.serviceName}`,
          `👤 *Profesional:* ${data.staffName}`,
          `🕐 *Hora:* ${timeStr}`,
          ``,
          `Te esperamos!`,
        ].join("\n"),
      },
      action: {
        buttons: [
          {
            type: "reply",
            reply: { id: "reminder_ok", title: "Ahí estaré" },
          },
          {
            type: "reply",
            reply: { id: "cancel_request", title: "Cancelar turno" },
          },
        ],
      },
    },
  };
}

function buildCancellation(data: WhatsAppMessage, dateStr: string, timeStr: string) {
  const body: Record<string, unknown> = {
    to: formatPhone(data.to),
    type: "text",
    text: {
      body: [
        `Hola ${data.clientName}. Tu turno en *${data.businessName}* fue cancelado.`,
        ``,
        `📋 *Servicio:* ${data.serviceName}`,
        `📅 *Fecha:* ${dateStr}`,
        `🕐 *Hora:* ${timeStr}`,
        ``,
        `Podés reservar un nuevo turno en nuestra web.`,
      ].join("\n"),
    },
  };

  // If we have a booking URL, use interactive button
  if (data.bookingUrl) {
    return {
      to: formatPhone(data.to),
      type: "interactive",
      interactive: {
        type: "cta_url",
        body: {
          text: [
            `Hola ${data.clientName}. Tu turno en *${data.businessName}* fue cancelado.`,
            ``,
            `📋 *Servicio:* ${data.serviceName}`,
            `📅 *Fecha:* ${dateStr}`,
            `🕐 *Hora:* ${timeStr}`,
          ].join("\n"),
        },
        action: {
          name: "cta_url",
          parameters: {
            display_text: "Reservar nuevo turno",
            url: data.bookingUrl,
          },
        },
      },
    };
  }

  return body;
}

function buildReviewRequest(data: WhatsAppMessage, dateStr: string, timeStr: string) {
  return {
    to: formatPhone(data.to),
    type: "interactive",
    interactive: {
      type: "button",
      body: {
        text: [
          `Hola ${data.clientName}! Gracias por visitarnos en *${data.businessName}*.`,
          ``,
          `¿Cómo fue tu experiencia con ${data.staffName}?`,
          `Tu opinión nos ayuda a mejorar 🙏`,
        ].join("\n"),
      },
      action: {
        buttons: [
          { type: "reply", reply: { id: "review_5", title: "⭐⭐⭐⭐⭐" } },
          { type: "reply", reply: { id: "review_4", title: "⭐⭐⭐⭐" } },
          { type: "reply", reply: { id: "review_3", title: "⭐⭐⭐" } },
        ],
      },
    },
  };
}

function buildCampaign(data: WhatsAppMessage) {
  return {
    to: formatPhone(data.to),
    type: "text",
    text: {
      body: data.campaignBody || `Hola ${data.clientName}! Mensaje de ${data.businessName}.`,
    },
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function sendWhatsApp(data: WhatsAppMessage): Promise<string | undefined> {
  const config = data.config || getDefaultConfig();

  if (!config) {
    const dt = toArgentinaDate(data.dateTime);
    const dateStr = format(dt, "EEEE d 'de' MMMM", { locale: es });
    const timeStr = format(dt, "HH:mm");
    log.warn("not configured — message not sent", {
      type: data.type,
      to: data.to,
      business: data.businessName,
      service: data.serviceName,
      when: `${dateStr} ${timeStr}`,
    });
    return undefined;
  }

  const dt = toArgentinaDate(data.dateTime);
  const dateStr = format(dt, "EEEE d 'de' MMMM", { locale: es });
  const timeStr = format(dt, "HH:mm");

  let body: Record<string, unknown>;

  switch (data.type) {
    case "confirmation":
      body = buildConfirmation(data, dateStr, timeStr);
      break;
    case "reminder":
      body = buildReminder(data, dateStr, timeStr);
      break;
    case "cancellation":
      body = buildCancellation(data, dateStr, timeStr);
      break;
    case "review_request":
      body = buildReviewRequest(data, dateStr, timeStr);
      break;
    case "campaign":
      body = buildCampaign(data);
      break;
    default:
      throw new Error(`Unknown message type: ${data.type}`);
  }

  const result = await sendRequest(config, body);
  return result.messageId;
}

// ─── Send raw text (for simple messages like campaigns) ───────────────────────

export async function sendWhatsAppText(
  to: string,
  text: string,
  config?: WhatsAppConfig
): Promise<string | undefined> {
  const resolvedConfig = config || getDefaultConfig();
  if (!resolvedConfig) {
    log.warn("not configured — text not sent", { to, preview: text.slice(0, 50) });
    return undefined;
  }

  const result = await sendRequest(resolvedConfig, {
    to: formatPhone(to),
    type: "text",
    text: { body: text },
  });
  return result.messageId;
}

// ─── Mark message as read ─────────────────────────────────────────────────────

export async function markAsRead(
  messageId: string,
  config?: WhatsAppConfig
): Promise<void> {
  const resolvedConfig = config || getDefaultConfig();
  if (!resolvedConfig) return;

  await sendRequest(resolvedConfig, {
    status: "read",
    message_id: messageId,
  });
}

// ─── Webhook signature verification ──────────────────────────────────────────

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  appSecret: string
): boolean {
  // Meta sends X-Hub-Signature-256 header as "sha256=<hex>"
  const expected = `sha256=${createHmac("sha256", appSecret).update(payload).digest("hex")}`;

  // Constant-time comparison: a plain === leaks how much of the signature
  // matched through timing.
  const expectedBuf = Buffer.from(expected, "utf8");
  const signatureBuf = Buffer.from(signature, "utf8");
  if (expectedBuf.length !== signatureBuf.length) return false;
  return timingSafeEqual(expectedBuf, signatureBuf);
}

// ─── Types for webhook payloads ──────────────────────────────────────────────

export interface WhatsAppWebhookMessage {
  from: string; // sender phone number
  id: string; // message ID
  timestamp: string;
  type: "text" | "interactive" | "image" | "button";
  text?: { body: string };
  interactive?: {
    type: "button_reply" | "list_reply";
    button_reply?: { id: string; title: string };
    list_reply?: { id: string; title: string; description?: string };
  };
}

export interface WhatsAppWebhookStatus {
  id: string;
  status: "sent" | "delivered" | "read" | "failed";
  timestamp: string;
  recipient_id: string;
  errors?: Array<{ code: number; title: string }>;
}

export interface WhatsAppWebhookEntry {
  id: string;
  changes: Array<{
    value: {
      messaging_product: "whatsapp";
      metadata: {
        display_phone_number: string;
        phone_number_id: string;
      };
      messages?: WhatsAppWebhookMessage[];
      statuses?: WhatsAppWebhookStatus[];
    };
    field: "messages";
  }>;
}
