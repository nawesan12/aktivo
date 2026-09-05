import { Resend } from "resend";

import { emailFrom, env, appUrl } from "@/lib/env";
import { createLogger } from "@/lib/logger";
import { button, lead, note, paragraph, renderEmail } from "./layout";

const log = createLogger("email:trial");

let cachedResend: Resend | null | undefined;

function getResend(): Resend | null {
  if (cachedResend === undefined) {
    cachedResend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;
  }
  return cachedResend;
}

export type TrialStage = "trial_3d" | "trial_1d" | "trial_ended";

/**
 * Los avisos de que la prueba se termina.
 *
 * Sin esto, quien no abre el panel en toda la semana se entera el día que
 * intenta cargar un turno y no puede. El aviso llega al correo, que es donde
 * está la persona, y lleva de un toque a dejar el medio de pago.
 */
export function buildTrialEmail(stage: TrialStage, businessName: string) {
  const url = appUrl("/panel/suscripcion");

  const copy = {
    trial_3d: {
      subject: `Te quedan 3 días de prueba — ${businessName}`,
      eyebrow: "Tu prueba",
      heading: "Te quedan 3 días",
      lead: "Dejá tu tarjeta ahora y no se te cobra nada hasta que termine.",
      body: "Así el día que se acabe la prueba no tenés que hacer nada: tu agenda sigue andando y tus clientes siguen reservando.",
      cta: "Activar mi plan",
    },
    trial_1d: {
      subject: `Mañana termina tu prueba — ${businessName}`,
      eyebrow: "Tu prueba",
      heading: "Mañana se termina",
      lead: "Cuando termine vas a poder seguir viendo todo, pero no cargar turnos nuevos.",
      body: "Dejá tu tarjeta hoy y no se interrumpe nada. Cancelás cuando quieras desde Mercado Pago.",
      cta: "Activar mi plan",
    },
    trial_ended: {
      subject: `Se terminó tu prueba — ${businessName}`,
      eyebrow: "Tu prueba",
      heading: "Se terminó tu prueba",
      lead: "Tu agenda sigue publicada y tus turnos están todos guardados.",
      body: "Para volver a cargar turnos y que tus clientes sigan reservando, elegí un plan. No perdiste nada de lo que cargaste.",
      cta: "Elegir mi plan",
    },
  }[stage];

  const { html, text } = renderEmail({
    preheader: copy.lead,
    eyebrow: copy.eyebrow,
    heading: copy.heading,
    blocks: [
      lead(copy.lead),
      paragraph(copy.body),
      button(url, copy.cta),
      note("Si ya lo activaste, ignorá este mensaje."),
    ],
    senderName: "Jiku",
  });

  return { subject: copy.subject, html, text };
}

export async function sendTrialEmail(to: string, stage: TrialStage, businessName: string) {
  const resend = getResend();
  if (!resend) {
    log.warn("Resend not configured — trial email not sent", { stage, businessName });
    return;
  }

  const { subject, html, text } = buildTrialEmail(stage, businessName);

  return resend.emails.send({ from: emailFrom("Jiku"), to, subject, html, text });
}
