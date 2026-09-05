import { Resend } from "resend";
import { appUrl, emailFrom, env } from "@/lib/env";
import { createLogger } from "@/lib/logger";

const log = createLogger("email:appointment");
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toArgentinaDate } from "@/lib/timezone";
import { button, details, lead, note, paragraph, renderEmail, type Block } from "./layout";

let cachedResend: Resend | null | undefined;

/**
 * Lazy client. Built at import time it would force every module that merely
 * imports this file to have the mail configuration present.
 */
function getResend(): Resend | null {
  if (cachedResend === undefined) {
    cachedResend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;
  }
  return cachedResend;
}

type EmailType =
  | "confirmation"
  | "reminder"
  | "reminder_soon"
  | "cancellation"
  | "waitlist_slot_open"
  | "slot_lost";

interface EmailData {
  to: string;
  type: EmailType;
  businessName: string;
  clientName: string;
  serviceName: string;
  staffName: string;
  dateTime: Date;
  /** Only used by `waitlist_slot_open`, where the whole point is the link. */
  bookingUrl?: string;
  /**
   * Turns the mail into something you can act on. Optional because it arrives
   * from seven call sites and a missing slug should cost the button, not the
   * mail — every one of them already loads the business row, so it is a
   * `select` away rather than a query.
   */
  businessSlug?: string;
}

/**
 * Subject, eyebrow, heading and preview line, decided together.
 *
 * They used to be spread across three lookups and the heading was always
 * "¡Hola <nombre>!", which spends the one line the inbox shows on a greeting.
 * The name moved into the body; the heading now says what happened.
 */
const COPY: Record<
  EmailType,
  { subject: (b: string) => string; eyebrow: string; heading: string; preheader: string }
> = {
  confirmation: {
    subject: (b) => `Turno confirmado — ${b}`,
    eyebrow: "Turno confirmado",
    heading: "Listo, tu turno quedó reservado",
    preheader: "Te esperamos. Acá están los datos de tu turno.",
  },
  reminder: {
    subject: (b) => `Mañana tenés turno — ${b}`,
    eyebrow: "Recordatorio",
    heading: "Mañana tenés turno",
    preheader: "Un recordatorio para que no se te pase.",
  },
  /*
    The one-hour reminder used to arrive saying "mañana": both reminders were
    mapped onto the same template, so the mail that goes out sixty minutes
    before the turno told the client it was the following day.
  */
  reminder_soon: {
    subject: (b) => `Tu turno es en un rato — ${b}`,
    eyebrow: "Recordatorio",
    heading: "Tu turno es en un rato",
    preheader: "Falta una hora. Te esperamos.",
  },
  cancellation: {
    subject: (b) => `Turno cancelado — ${b}`,
    eyebrow: "Turno cancelado",
    heading: "Tu turno fue cancelado",
    preheader: "Podés reservar otro horario cuando quieras.",
  },
  waitlist_slot_open: {
    subject: (b) => `Se liberó un turno — ${b}`,
    eyebrow: "Se liberó un lugar",
    heading: "Se liberó el horario que esperabas",
    preheader: "El primero que reserve se lo lleva.",
  },
  slot_lost: {
    subject: (b) => `No pudimos confirmar tu turno — ${b}`,
    eyebrow: "No pudimos confirmarlo",
    heading: "Ese horario se ocupó antes de que entrara tu pago",
    preheader: "Te vamos a devolver el dinero.",
  },
};

/**
 * Only where it says something the heading did not.
 *
 * Every type used to carry one, and for three of them it restated the heading
 * word for word — "Tu turno fue cancelado" under "Tu turno fue cancelado".
 */
const LEAD: Partial<Record<EmailType, string>> = {
  waitlist_slot_open: "El primero que reserve se lo lleva, así que no lo dejes para después.",
  slot_lost:
    "Tu pago se acreditó, pero mientras tanto ese horario lo tomó otra persona. El negocio te va a devolver el dinero. Perdón por la molestia.",
};

function buildEmail(data: EmailData): { subject: string; html: string; text: string } {
  const dt = toArgentinaDate(data.dateTime);
  /*
    The year only when it is not the current one. A turno is almost always days
    away, so "de 2026" is a word nobody reads that wrapped the date onto three
    lines on a phone.
  */
  const sameYear = dt.getFullYear() === toArgentinaDate(new Date()).getFullYear();
  const dateStr = format(dt, sameYear ? "EEEE d 'de' MMMM" : "EEEE d 'de' MMMM 'de' yyyy", {
    locale: es,
  });
  const timeStr = format(dt, "HH:mm");
  const copy = COPY[data.type];

  const leadLine = LEAD[data.type];
  const blocks: Block[] = [paragraph(`Hola ${data.clientName},`)];
  if (leadLine) blocks.push(lead(leadLine));

  blocks.push(
    details([
      { label: "Servicio", value: data.serviceName },
      { label: "Profesional", value: data.staffName },
      { label: "Fecha", value: dateStr },
      { label: "Hora", value: timeStr, strong: true },
    ])
  );

  // Somewhere to go, which none of these mails had: the reader could see the
  // turno but not reschedule it, cancel it, or book the next one without
  // going to find the shop's page themselves.
  const slug = data.businessSlug;
  if (data.type === "waitlist_slot_open" && data.bookingUrl) {
    blocks.push(button(data.bookingUrl, "Reservar este turno"));
  } else if (data.type === "cancellation" || data.type === "slot_lost") {
    if (slug) blocks.push(button(appUrl(`/${slug}/reservar`), "Reservar otro turno"));
    else blocks.push(note("Podés elegir otro horario en nuestra web cuando quieras."));
  } else {
    if (slug) blocks.push(button(appUrl(`/${slug}/mis-turnos`), "Ver o cambiar mi turno"));
    blocks.push(note("¡Te esperamos!"));
  }

  const { html, text } = renderEmail({
    preheader: copy.preheader,
    eyebrow: copy.eyebrow,
    heading: copy.heading,
    blocks,
    senderName: data.businessName,
  });

  return { subject: copy.subject(data.businessName), html, text };
}

/** Exported for the preview script and the tests. */
export { buildEmail as buildAppointmentEmail };
export type { EmailData as AppointmentEmailData };

export async function sendEmail(data: EmailData) {
  const resend = getResend();
  const { subject, html, text } = buildEmail(data);

  if (!resend) {
    log.warn("Resend not configured — email not sent", { subject });
    return;
  }

  return resend.emails.send({
    from: emailFrom(data.businessName),
    to: data.to,
    subject,
    // Both parts, always: an HTML-only mail scores worse with spam filters and
    // reads as a blank message in a client with images and markup turned off.
    html,
    text,
  });
}
