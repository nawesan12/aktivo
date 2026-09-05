import { Resend } from "resend";
import { emailFrom, env } from "@/lib/env";
import { createLogger } from "@/lib/logger";
import { code as codeBlock, note, paragraph, renderEmail } from "./layout";

const log = createLogger("email:verification");

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

export function buildVerificationEmail(code: string, businessName: string) {
  const { html, text } = renderEmail({
    // The code does not go in the preheader on purpose: that line shows on a
    // locked screen, and this one is the whole secret.
    preheader: `Tu código para ver tus turnos en ${businessName}. Vence en 10 minutos.`,
    eyebrow: "Código de acceso",
    heading: "Tu código para entrar",
    blocks: [
      paragraph(`Usalo para ver y manejar tus turnos en ${businessName}.`),
      codeBlock(code),
      note("Vence en 10 minutos. Si no lo pediste vos, ignorá este mensaje."),
    ],
    senderName: businessName,
  });

  return { subject: `Tu código de acceso — ${businessName}`, html, text };
}

export async function sendVerificationEmail(
  email: string,
  code: string,
  businessName: string
) {
  const resend = getResend();
  if (!resend) {
    // Never log the code itself: it is the whole secret.
    log.warn("Resend not configured — verification code not sent", { businessName });
    return;
  }

  const { subject, html, text } = buildVerificationEmail(code, businessName);

  return resend.emails.send({
    from: emailFrom(businessName),
    to: email,
    subject,
    html,
    text,
  });
}
