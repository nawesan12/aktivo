import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

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
        Recupera tu contrasena
      </h2>
      <p style="color:#a1a1aa;font-size:16px;line-height:1.6;margin:0 0 24px 0;">
        Recibimos una solicitud para restablecer la contrasena de tu cuenta. Hace click en el boton de abajo para crear una nueva contrasena.
      </p>
      <div style="text-align:center;margin-bottom:24px;">
        <a href="${resetUrl}" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#4ADE80,#22c55e);color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">
          Restablecer contrasena
        </a>
      </div>
      <p style="color:#71717a;font-size:13px;line-height:1.5;margin:0;">
        Este enlace expira en 1 hora. Si no solicitaste este cambio, podes ignorar este email.
      </p>
    </div>
    <p style="text-align:center;color:#52525b;font-size:12px;margin-top:24px;">
      Jiku &middot; Plataforma de gestion para negocios de servicios
    </p>
  </div>
</body>
</html>`;
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${APP_URL}/recuperar-contrasena?token=${token}`;

  if (!resend) {
    console.log("[Email] Resend not configured. Reset URL:", resetUrl);
    return;
  }

  const result = await resend.emails.send({
    from: process.env.RESEND_FROM || "Jiku <onboarding@resend.dev>",
    to: email,
    subject: "Recupera tu contrasena — Jiku",
    html: getResetEmailHtml(resetUrl),
  });

  return result;
}
