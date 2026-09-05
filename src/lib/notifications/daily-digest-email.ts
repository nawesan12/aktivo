import { Resend } from "resend";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { emailFrom, env, appUrl } from "@/lib/env";
import { createLogger } from "@/lib/logger";
import { toArgentinaDate } from "@/lib/timezone";
import { button, details, lead, note, paragraph, renderEmail } from "./layout";

const log = createLogger("email:daily-digest");

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

export interface DigestAppointment {
  dateTime: Date;
  clientName: string;
  serviceName: string;
  staffName: string;
}

/**
 * "Tus turnos de mañana", para el negocio.
 *
 * La única notificación que salía por una reserva era la del cliente: el dueño
 * se enteraba si abría el panel, y un turno tomado a las once de la noche
 * esperaba hasta que alguien mirara. Éste es el correo que hace que no haga
 * falta mirar.
 *
 * Un resumen a la tarde y no un aviso por reserva: con diez turnos en un día
 * bueno, lo segundo son diez correos que se terminan filtrando a una carpeta.
 */
export function buildDailyDigestEmail(
  businessName: string,
  day: Date,
  appointments: DigestAppointment[]
) {
  const dayLabel = format(toArgentinaDate(day), "EEEE d 'de' MMMM", { locale: es });
  const total = appointments.length;

  const { html, text } = renderEmail({
    preheader: `${total} turno${total === 1 ? "" : "s"} el ${dayLabel}.`,
    eyebrow: "Tus turnos de mañana",
    heading: total === 1 ? "Mañana tenés un turno" : `Mañana tenés ${total} turnos`,
    blocks: [
      lead(`${dayLabel.charAt(0).toUpperCase()}${dayLabel.slice(1)}`),
      // La hora como etiqueta y quién viene como valor: es la forma en que se
      // lee una agenda, y reusa el mismo bloque que el resto de los correos.
      details(
        appointments.map((appointment) => ({
          label: format(toArgentinaDate(appointment.dateTime), "HH:mm"),
          value: `${appointment.clientName} · ${appointment.serviceName}`,
        }))
      ),
      paragraph(
        appointments.some((a) => a.staffName)
          ? "Abrí el panel para ver con quién va cada uno, los teléfonos y las notas."
          : "Abrí el panel para ver los teléfonos y las notas."
      ),
      button(appUrl("/panel/calendario"), "Ver mi agenda"),
      note("Te llega una vez por día, a la tarde. Lo apagás en Configuración."),
    ],
    senderName: businessName,
  });

  return {
    subject: `Mañana tenés ${total} turno${total === 1 ? "" : "s"} — ${businessName}`,
    html,
    text,
  };
}

export async function sendDailyDigestEmail(
  to: string,
  businessName: string,
  day: Date,
  appointments: DigestAppointment[]
) {
  const resend = getResend();
  if (!resend) {
    log.warn("Resend not configured — daily digest not sent", { businessName });
    return;
  }

  const { subject, html, text } = buildDailyDigestEmail(businessName, day, appointments);

  return resend.emails.send({
    from: emailFrom(businessName),
    to,
    subject,
    html,
    text,
  });
}
