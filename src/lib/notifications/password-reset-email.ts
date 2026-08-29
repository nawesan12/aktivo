import { Resend } from "resend";
import { appUrl, emailFrom, env } from "@/lib/env";
import { createLogger } from "@/lib/logger";

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



function getResetEmailHtml(resetUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#09090b;font-family:system-ui,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="background:linear-gradient(135deg,#4ADE80,#22c55e);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-size:28px;margin:0;">
        Jiku
      </h1>
    </div>
    <div style="background-color:#18181b;border-radius:12px;padding:32px;border:1px solid rgba(255,255,255,0.1);">
      <h2 style="color:#fafafa;font-size:20px;margin:0 0 16px 0;">
        Recuperá tu contraseña
      </h2>
      <p style="color:#a1a1aa;font-size:16px;line-height:1.6;margin:0 0 24px 0;">
        Recibimos una solicitud para restablecer la contraseña de tu cuenta. Hace click en el boton de abajo para crear una nueva contraseña.
      </p>
      <div style="text-align:center;margin-bottom:24px;">
        <a href="${resetUrl}" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#4ADE80,#22c55e);color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">
          Restablecer contraseña
        </a>
      </div>
      <p style="color:#71717a;font-size:13px;line-height:1.5;margin:0;">
        Este enlace expira en 1 hora. Si no solicitaste este cambio, podes ignorar este email.
      </p>
    </div>
    <p style="text-align:center;color:#52525b;font-size:12px;margin-top:24px;">
      Jiku &middot; Plataforma de gestión para negocios de servicios
    </p>
  </div>
</body>
</html>`;
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = appUrl(`/recuperar-contrasena?token=${token}`);

  const resend = getResend();
  if (!resend) {
    log.warn("Resend not configured — reset link not sent", { resetUrl });
    return;
  }

  const result = await resend.emails.send({
    from: emailFrom(),
    to: email,
    subject: "Recuperá tu contraseña — Jiku",
    html: getResetEmailHtml(resetUrl),
  });

  return result;
}
