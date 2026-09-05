import { Resend } from "resend";
import { appUrl, emailFrom, env } from "@/lib/env";
import { createLogger } from "@/lib/logger";
import { button, lead, note, paragraph, renderEmail } from "./layout";

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

export function buildMercadoPagoExpiringEmail(
  businessName: string,
  link: string,
  deadline: string | null
) {
  const { html, text } = renderEmail({
    preheader: deadline
      ? `Vence el ${deadline}. Después de esa fecha nadie puede pagar la seña.`
      : "Conviene reconectarla ahora, antes de que deje de cobrar.",
    eyebrow: "Cobros",
    heading: "Hay que reconectar Mercado Pago",
    blocks: [
      lead(
        `La conexión de ${businessName} con Mercado Pago está por vencer y no la pudimos renovar sola.`
      ),
      paragraph(
        deadline
          ? `Vence el ${deadline}. Hasta entonces seguís cobrando normal; después de esa fecha, tus clientes no van a poder pagar la seña al reservar.`
          : "Mientras tanto seguís cobrando normal, pero conviene reconectarla ahora."
      ),
      button(link, "Reconectar Mercado Pago"),
      note("Son dos clicks: entrás, autorizás con tu cuenta de Mercado Pago y listo."),
    ],
    senderName: "Jiku",
  });

  return { subject: `Reconectá Mercado Pago — ${businessName}`, html, text };
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

  const { subject, html, text } = buildMercadoPagoExpiringEmail(
    businessName,
    appUrl("/panel/pagos"),
    deadline
  );

  return resend.emails.send({ from: emailFrom(), to, subject, html, text });
}
