import { Resend } from "resend";
import { emailFrom, env } from "@/lib/env";
import { createLogger } from "@/lib/logger";
import { button, note, paragraph, renderEmail, stars } from "./layout";

const log = createLogger("email:review-request");

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

interface ReviewRequestData {
  to: string;
  clientName: string;
  businessName: string;
  serviceName: string;
  reviewUrl: string;
}

export function buildReviewRequestEmail(data: ReviewRequestData) {
  const { html, text } = renderEmail({
    preheader: `Contanos cómo fue tu ${data.serviceName}. Es un toque.`,
    eyebrow: "Tu opinión",
    heading: "¿Cómo te fue?",
    blocks: [
      paragraph(`Hola ${data.clientName},`),
      paragraph(
        `Pasaste por ${data.businessName} por un ${data.serviceName}. Si tenés un minuto, contanos cómo estuvo: elegí las estrellas y listo.`
      ),
      // The stars are the call to action. Tapping one opens the review already
      // set to that score, so the whole thing is one tap for somebody who has
      // nothing else to add.
      stars(data.reviewUrl),
      button(data.reviewUrl, "Dejar mi reseña"),
      note("El enlace vence en 7 días."),
    ],
    senderName: data.businessName,
  });

  return { subject: `¿Cómo fue tu visita? — ${data.businessName}`, html, text };
}

export async function sendReviewRequestEmail(
  data: ReviewRequestData
): Promise<{ success: boolean; error?: string }> {
  const resend = getResend();
  if (!resend) {
    log.warn("Resend not configured — review request skipped", { to: data.to });
    return { success: false, error: "Resend not configured" };
  }

  const { subject, html, text } = buildReviewRequestEmail(data);

  try {
    await resend.emails.send({
      // From the shop, not from Jiku: this asks a favour on their behalf, and
      // a name the client recognises is what gets it opened.
      from: emailFrom(data.businessName),
      to: data.to,
      subject,
      html,
      text,
    });
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error sending review email";
    log.error("send failed", undefined, { reason: message });
    return { success: false, error: message };
  }
}
