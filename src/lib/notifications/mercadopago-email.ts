import { Resend } from "resend";
import { appUrl, emailFrom, env } from "@/lib/env";
import { createLogger } from "@/lib/logger";

const log = createLogger("email:mercadopago");

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

function html(businessName: string, link: string, deadline: string | null): string {
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
        Hay que reconectar Mercado Pago
      </h2>
      <p style="color:#a1a1aa;font-size:16px;line-height:1.6;margin:0 0 16px 0;">
        La conexión de <strong style="color:#fafafa;">${businessName}</strong> con Mercado Pago
        está por vencer y no la pudimos renovar sola.
      </p>
      <p style="color:#a1a1aa;font-size:16px;line-height:1.6;margin:0 0 24px 0;">
        ${
          deadline
            ? `Vence el ${deadline}. Hasta entonces seguís cobrando normal; después de esa fecha, tus clientes no van a poder pagar la seña al reservar.`
            : `Mientras tanto seguís cobrando normal, pero conviene reconectarla ahora.`
        }
      </p>
      <a href="${link}" style="display:inline-block;background-color:#4ADE80;color:#09090b;text-decoration:none;font-weight:700;font-size:15px;padding:12px 24px;border-radius:8px;">
        Reconectar Mercado Pago
      </a>
      <p style="color:#71717a;font-size:13px;line-height:1.6;margin:24px 0 0;">
        Son dos clicks: entrás, autorizás con tu cuenta de Mercado Pago y listo.
      </p>
    </div>
    <p style="text-align:center;color:#52525b;font-size:12px;margin-top:24px;">
      Jiku &middot; ${businessName}
    </p>
  </div>
</body>
</html>`;
}

/**
 * Warns an owner that their MercadoPago link could not be renewed.
 *
 * Sent once per broken link, not on every pass of the job: the same warning
 * every half hour trains people to ignore it.
 */
export async function sendMercadoPagoLinkExpiring({
  to,
  businessName,
  expiresAt,
}: {
  to: string;
  businessName: string;
  businessSlug: string;
  expiresAt: Date | null;
}) {
  const resend = getResend();
  if (!resend) {
    log.warn("Resend not configured — renewal warning not sent", { businessName });
    return;
  }

  const deadline = expiresAt
    ? expiresAt.toLocaleDateString("es-AR", { day: "numeric", month: "long" })
    : null;

  return resend.emails.send({
    from: emailFrom(),
    to,
    subject: `Reconectá Mercado Pago — ${businessName}`,
    html: html(businessName, appUrl("/panel/pagos"), deadline),
  });
}
