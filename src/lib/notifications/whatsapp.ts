import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toArgentinaDate } from "@/lib/timezone";

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
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!phoneNumberId || !accessToken) return null;
  return { phoneNumberId, accessToken };
}

// ─── Core send function ───────────────────────────────────────────────────────

async function sendRequest(
  config: WhatsAppConfig,
  body: Record<string, unknown>
): Promise<{ messageId: string }> {
  const url = `${BASE_URL}/${config.phoneNumberId}/messages`;

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
    throw new Error(`WhatsApp API error: ${msg}`);
  }

  const data = await res.json();
  return { messageId: data.messages?.[0]?.id || "" };
}

// ─── Phone number formatting ──────────────────────────────────────────────────

function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  // Ensure country code for Argentina
  if (cleaned.startsWith("549")) return cleaned;
  if (cleaned.startsWith("54")) return cleaned;
  if (cleaned.startsWith("0")) return `54${cleaned.slice(1)}`;
  if (cleaned.length === 10) return `549${cleaned}`;
  return cleaned;
}

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
    console.log(`[WhatsApp] Meta Cloud API not configured. Would send ${data.type} to ${data.to}`);
    console.log(`  Business: ${data.businessName}, Service: ${data.serviceName}`);
    console.log(`  Date: ${dateStr} ${timeStr}`);
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
    console.log(`[WhatsApp] Not configured. Would send text to ${to}: ${text.slice(0, 50)}...`);
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
  const crypto = require("crypto") as typeof import("crypto");
  const expected = crypto
    .createHmac("sha256", appSecret)
    .update(payload)
    .digest("hex");
  return `sha256=${expected}` === signature;
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
