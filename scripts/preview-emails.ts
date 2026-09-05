/**
 * Renders every email to design/emails/ so they can actually be looked at.
 *
 * Nobody was looking at them: they only ever appeared in somebody's inbox, in
 * production, once. Writing them to disk is what caught that five of the six
 * were laid out with `<div>` and would spill across the page in Outlook.
 *
 *   npx tsx scripts/preview-emails.ts
 */
import "dotenv/config";
import { mkdirSync, writeFileSync } from "node:fs";

import { buildAppointmentEmail } from "@/lib/notifications/email";
import { buildReviewRequestEmail } from "@/lib/notifications/review-request-email";
import { buildInviteEmail } from "@/lib/notifications/invite-email";
import { buildPasswordResetEmail } from "@/lib/notifications/password-reset-email";
import { buildAccessLinkEmail } from "@/lib/notifications/access-link-email";
import { buildMercadoPagoExpiringEmail } from "@/lib/notifications/mercadopago-email";
import { buildDailyDigestEmail } from "@/lib/notifications/daily-digest-email";

const OUT = "design/emails";
const when = new Date("2026-09-12T13:30:00.000Z"); // viernes 10:30 en Argentina

const base = {
  to: "lucia@example.com",
  businessName: "El Corte Barbería",
  clientName: "Lucía",
  serviceName: "Corte + Color",
  staffName: "Martín",
  dateTime: when,
  businessSlug: "el-corte",
  businessAddress: "Av. Colón 1234, Mar del Plata",
};

const emails = [
  ["turno-confirmacion", buildAppointmentEmail({ ...base, type: "confirmation" })],
  ["turno-recordatorio", buildAppointmentEmail({ ...base, type: "reminder" })],
  ["turno-recordatorio-1h", buildAppointmentEmail({ ...base, type: "reminder_soon" })],
  ["turno-cancelacion", buildAppointmentEmail({ ...base, type: "cancellation" })],
  [
    "lista-espera",
    buildAppointmentEmail({
      ...base,
      type: "waitlist_slot_open",
      bookingUrl: "https://jikuapp.com/el-corte/reservar",
    }),
  ],
  ["turno-perdido", buildAppointmentEmail({ ...base, type: "slot_lost" })],
  [
    "resena",
    buildReviewRequestEmail({
      to: base.to,
      clientName: base.clientName,
      businessName: base.businessName,
      serviceName: base.serviceName,
      reviewUrl: "https://jikuapp.com/review/abc123",
    }),
  ],
  ["invitacion", buildInviteEmail("https://jikuapp.com/invitacion?token=abc123", base.businessName)],
  ["contrasena", buildPasswordResetEmail("https://jikuapp.com/recuperar-contrasena?token=abc123")],
  ["acceso", buildAccessLinkEmail("https://jikuapp.com/api/client/auth/link?t=abc123")],
  [
    "resumen-diario",
    buildDailyDigestEmail("El Corte Barbería", new Date("2026-09-12T12:00:00.000Z"), [
      {
        dateTime: new Date("2026-09-12T12:00:00.000Z"),
        clientName: "Lucía Fernández",
        serviceName: "Corte + Color",
        staffName: "Martín",
      },
      {
        dateTime: new Date("2026-09-12T13:30:00.000Z"),
        clientName: "Juan Pérez",
        serviceName: "Barba",
        staffName: "Martín",
      },
      {
        dateTime: new Date("2026-09-12T17:00:00.000Z"),
        clientName: "Sofía Gómez",
        serviceName: "Corte Clásico",
        staffName: "Diego",
      },
    ]),
  ],
  [
    "mercadopago",
    buildMercadoPagoExpiringEmail(base.businessName, "https://jikuapp.com/panel/pagos", "20 de septiembre"),
  ],
] as const;

mkdirSync(OUT, { recursive: true });

for (const [name, mail] of emails) {
  writeFileSync(`${OUT}/${name}.html`, mail.html);
  writeFileSync(`${OUT}/${name}.txt`, `Asunto: ${mail.subject}\n\n${mail.text}`);
  console.log(`${OUT}/${name}.html   «${mail.subject}»`);
}

console.log(`\n${emails.length} correos escritos en ${OUT}/`);
