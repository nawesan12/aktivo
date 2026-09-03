import { Resend } from "resend";
import { emailFrom, env } from "@/lib/env";
import { createLogger } from "@/lib/logger";

const log = createLogger("email:guest-verification");

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

function getVerificationEmailHtml(code: string, businessName: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#09090b;font-family:system-ui,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="background:linear-gradient(135deg,#4ADE80,#22c55e);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-size:28px;margin:0;">
        ${businessName}
      </h1>
      <p style="color:#a1a1aa;font-size:12px;margin:4px 0 0;">Powered by Jiku</p>
    </div>
    <div style="background-color:#18181b;border-radius:12px;padding:32px;border:1px solid rgba(255,255,255,0.1);">
      <h2 style="color:#fafafa;font-size:20px;margin:0 0 16px 0;">
        Tu código de acceso
      </h2>
      <p style="color:#a1a1aa;font-size:16px;line-height:1.6;margin:0 0 24px 0;">
        Usá este código para ver y gestionar tus turnos en ${businessName}.
      </p>
      <div style="background-color:#09090b;border-radius:8px;padding:24px;text-align:center;margin-bottom:24px;">
        <span style="color:#4ADE80;font-size:36px;font-weight:700;letter-spacing:8px;font-family:monospace;">${code}</span>
      </div>
      <p style="color:#a1a1aa;font-size:14px;line-height:1.6;margin:0;">
        Vence en 10 minutos. Si no lo pediste vos, ignorá este mensaje.
      </p>
    </div>
    <p style="text-align:center;color:#52525b;font-size:12px;margin-top:24px;">
      ${businessName} &middot; Powered by Jiku
    </p>
  </div>
</body>
</html>`;
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

  const result = await resend.emails.send({
    from: emailFrom(businessName),
    to: email,
    subject: `Tu código de acceso — ${businessName}`,
    html: getVerificationEmailHtml(code, businessName),
  });

  return result;
}
