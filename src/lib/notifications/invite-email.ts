import { Resend } from "resend";
import { appUrl, emailFrom, env } from "@/lib/env";
import { createLogger } from "@/lib/logger";
import { button, fallbackLink, note, paragraph, renderEmail } from "./layout";

const log = createLogger("email:invite");

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

export function buildInviteEmail(inviteUrl: string, businessName: string) {
  const { html, text } = renderEmail({
    preheader: `Sumate al equipo de ${businessName} en Jiku.`,
    eyebrow: "Invitación",
    heading: `Te sumaron al equipo de ${businessName}`,
    blocks: [
      paragraph(
        `Alguien de ${businessName} te invitó a manejar la agenda con ellos. Aceptá la invitación y creás tu cuenta en el mismo paso.`
      ),
      button(inviteUrl, "Aceptar la invitación"),
      note("El enlace vence en 7 días. Si no esperabas esta invitación, ignorá este mensaje."),
      fallbackLink(inviteUrl),
    ],
    senderName: "Jiku",
  });

  return { subject: `Te invitaron a ${businessName} — Jiku`, html, text };
}

export async function sendInviteEmail(email: string, token: string, businessName: string) {
  const inviteUrl = appUrl(`/invitacion?token=${token}`);

  const resend = getResend();
  if (!resend) {
    log.warn("Resend not configured — invite not sent", { inviteUrl });
    return;
  }

  const { subject, html, text } = buildInviteEmail(inviteUrl, businessName);

  return resend.emails.send({
    from: emailFrom(),
    to: email,
    subject,
    html,
    text,
  });
}
