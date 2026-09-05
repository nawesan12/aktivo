import { describe, expect, it } from "vitest";

import { buildAppointmentEmail } from "@/lib/notifications/email";
import { buildReviewRequestEmail } from "@/lib/notifications/review-request-email";
import { buildInviteEmail } from "@/lib/notifications/invite-email";
import { buildPasswordResetEmail } from "@/lib/notifications/password-reset-email";
import { buildVerificationEmail } from "@/lib/notifications/verification-email";
import { buildMercadoPagoExpiringEmail } from "@/lib/notifications/mercadopago-email";

/**
 * Email is the only channel this product has, and it is the one surface nobody
 * ever looks at: it renders once, in somebody else's inbox, in production.
 * These are the failures that would go unnoticed there.
 */

const base = {
  to: "lucia@example.com",
  businessName: "El Corte Barbería",
  businessSlug: "el-corte",
  clientName: "Lucía",
  serviceName: "Corte + Color",
  staffName: "Martín",
  dateTime: new Date("2026-09-12T13:30:00.000Z"),
};

const everyEmail = () => [
  { name: "confirmation", mail: buildAppointmentEmail({ ...base, type: "confirmation" }) },
  { name: "reminder", mail: buildAppointmentEmail({ ...base, type: "reminder" }) },
  { name: "reminder_soon", mail: buildAppointmentEmail({ ...base, type: "reminder_soon" }) },
  { name: "cancellation", mail: buildAppointmentEmail({ ...base, type: "cancellation" }) },
  {
    name: "waitlist_slot_open",
    mail: buildAppointmentEmail({
      ...base,
      type: "waitlist_slot_open",
      bookingUrl: "https://jikuapp.com/el-corte/reservar",
    }),
  },
  { name: "slot_lost", mail: buildAppointmentEmail({ ...base, type: "slot_lost" }) },
  {
    name: "review",
    mail: buildReviewRequestEmail({
      to: base.to,
      clientName: base.clientName,
      businessName: base.businessName,
      serviceName: base.serviceName,
      reviewUrl: "https://jikuapp.com/review/abc",
    }),
  },
  { name: "invite", mail: buildInviteEmail("https://jikuapp.com/invitacion?token=a", "El Corte") },
  { name: "reset", mail: buildPasswordResetEmail("https://jikuapp.com/recuperar-contrasena?token=a") },
  { name: "verification", mail: buildVerificationEmail("482913", base.businessName) },
  {
    name: "mercadopago",
    mail: buildMercadoPagoExpiringEmail("El Corte", "https://jikuapp.com/panel/pagos", "20 de septiembre"),
  },
];

describe("todos los correos", () => {
  for (const { name, mail } of everyEmail()) {
    describe(name, () => {
      it("trae asunto, html y texto plano", () => {
        expect(mail.subject.length, "asunto vacío").toBeGreaterThan(0);
        expect(mail.html).toContain("<!DOCTYPE");
        // A mail without a text part scores worse with spam filters and shows
        // up blank in a client with markup turned off.
        expect(mail.text.trim().length, "sin parte de texto").toBeGreaterThan(20);
      });

      it("no pinta texto con background-clip", () => {
        /*
          Where `background-clip:text` is unsupported the transparent fill still
          applies and the text disappears. Every template used to print the
          shop's name that way.
        */
        expect(mail.html).not.toContain("background-clip");
        expect(mail.html).not.toContain("text-fill-color");
      });

      it("se arma con tablas, que es lo que entiende Outlook", () => {
        expect(mail.html).toContain("<table");
        expect(mail.html).toContain('role="presentation"');
      });

      it("declara el esquema de color y trae preheader", () => {
        expect(mail.html).toContain('name="color-scheme"');
        expect(mail.html).toContain("mso-hide:all");
      });
    });
  }
});

describe("el recordatorio dice cuándo es el turno", () => {
  it("el de 24 h habla de mañana", () => {
    const { subject, html } = buildAppointmentEmail({ ...base, type: "reminder" });
    expect(subject).toContain("Mañana");
    expect(html).toContain("Mañana tenés turno");
  });

  it("el de 1 h no dice mañana", () => {
    // Both reminders used to render the same template, so the mail that goes
    // out sixty minutes before the turno announced it for the following day.
    const { subject, html } = buildAppointmentEmail({ ...base, type: "reminder_soon" });
    expect(subject).not.toContain("Mañana");
    expect(html).not.toContain("Mañana tenés turno");
    expect(html).toContain("en un rato");
  });
});

describe("los datos del turno", () => {
  it("van en la hora de Argentina, no en UTC", () => {
    // 13:30 UTC es 10:30 en Argentina. Con la zona mal, diría 13:30.
    const { html } = buildAppointmentEmail({ ...base, type: "confirmation" });
    expect(html).toContain("10:30");
    expect(html).not.toContain("13:30");
  });

  it("escapan el HTML del nombre del negocio", () => {
    const { html } = buildAppointmentEmail({
      ...base,
      type: "confirmation",
      businessName: '<script>alert("x")</script>',
    });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });
});

describe("las estrellas de la reseña", () => {
  it("llevan cada una a su puntaje", () => {
    const { html } = buildReviewRequestEmail({
      to: base.to,
      clientName: base.clientName,
      businessName: base.businessName,
      serviceName: base.serviceName,
      reviewUrl: "https://jikuapp.com/review/abc",
    });
    for (const n of [1, 2, 3, 4, 5]) {
      expect(html).toContain(`/review/abc?estrellas=${n}`);
    }
  });

  it("respetan una URL que ya trae parámetros", () => {
    const { html } = buildReviewRequestEmail({
      to: base.to,
      clientName: base.clientName,
      businessName: base.businessName,
      serviceName: base.serviceName,
      reviewUrl: "https://jikuapp.com/review/abc?ref=mail",
    });
    expect(html).toContain("?ref=mail&amp;estrellas=3");
  });
});

describe("el botón de acción", () => {
  it("aparece cuando se conoce el negocio", () => {
    const { html } = buildAppointmentEmail({ ...base, type: "confirmation" });
    expect(html).toContain("/el-corte/mis-turnos");
  });

  it("no rompe el correo cuando falta el slug", () => {
    const { html, text } = buildAppointmentEmail({
      ...base,
      type: "confirmation",
      businessSlug: undefined,
    });
    expect(html).toContain("<!DOCTYPE");
    expect(html).not.toContain("undefined");
    expect(text).not.toContain("undefined");
  });
});
