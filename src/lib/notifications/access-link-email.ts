import { Resend } from "resend";
import { emailFrom, env } from "@/lib/env";
import { createLogger } from "@/lib/logger";
import { button, fallbackLink, note, paragraph, renderEmail } from "./layout";

const log = createLogger("email:access-link");

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

/**
 * One link, one tap, no code.
 *
 * This used to carry six digits to be copied back into the page — which meant
 * leaving the browser, opening the mail app, holding a number in your head and
 * returning. For a haircut. The link does the same job and asks for nothing.
 */
export function buildAccessLinkEmail(url: string) {
  const { html, text } = renderEmail({
    preheader: "Entrá a tus turnos. El link vale 15 minutos.",
    eyebrow: "Tus turnos",
    heading: "Entrá a tus turnos",
    blocks: [
      paragraph("Tocá el botón y vas a ver todo lo que reservaste, en cualquier local."),
      button(url, "Ver mis turnos"),
      fallbackLink(url),
      note("El link vale 15 minutos. Si no lo pediste vos, ignorá este mensaje."),
    ],
    senderName: "Jiku",
  });

  return { subject: "Entrá a tus turnos", html, text };
}

export async function sendAccessLinkEmail(email: string, url: string) {
  const resend = getResend();
  if (!resend) {
    // Never log the URL: it is the whole secret.
    log.warn("Resend not configured — access link not sent");
    return;
  }

  const { subject, html, text } = buildAccessLinkEmail(url);

  return resend.emails.send({
    from: emailFrom("Jiku"),
    to: email,
    subject,
    html,
    text,
  });
}
