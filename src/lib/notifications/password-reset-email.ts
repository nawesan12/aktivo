import { Resend } from "resend";
import { appUrl, emailFrom, env } from "@/lib/env";
import { createLogger } from "@/lib/logger";
import { button, fallbackLink, note, paragraph, renderEmail } from "./layout";

const log = createLogger("email:password-reset");

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

export function buildPasswordResetEmail(resetUrl: string) {
  const { html, text } = renderEmail({
    preheader: "Un enlace para elegir una contraseña nueva. Vence en una hora.",
    eyebrow: "Tu cuenta",
    heading: "Elegí una contraseña nueva",
    blocks: [
      paragraph(
        "Pediste restablecer la contraseña de tu cuenta. Entrá por acá y elegís una nueva."
      ),
      button(resetUrl, "Restablecer mi contraseña"),
      note(
        "El enlace vence en 1 hora. Si no pediste el cambio, ignorá este mensaje: tu contraseña sigue como estaba."
      ),
      fallbackLink(resetUrl),
    ],
    senderName: "Jiku",
  });

  return { subject: "Recuperá tu contraseña — Jiku", html, text };
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = appUrl(`/recuperar-contrasena?token=${token}`);

  const resend = getResend();
  if (!resend) {
    log.warn("Resend not configured — reset link not sent", { resetUrl });
    return;
  }

  const { subject, html, text } = buildPasswordResetEmail(resetUrl);

  return resend.emails.send({
    from: emailFrom(),
    to: email,
    subject,
    html,
    text,
  });
}
