import { test, expect } from "@playwright/test";

import { loadBookingFixture, testGuest, type BookingFixture } from "./fixtures";
import { bookUpToSlot, fillGuest } from "./booking-flow";

/**
 * The booking screen as a customer walks it: pick a service, a professional and
 * a time — all three visible at once — leave your details, confirm.
 *
 * The existing specs stopped at "the page rendered". This one only passes if a
 * booking actually comes out the other end.
 */

let fixture: BookingFixture;

test.beforeAll(async ({ request }) => {
  fixture = await loadBookingFixture(request);
});

test("un cliente reserva un turno de principio a fin", async ({ page }) => {
  const guest = testGuest("101");

  await bookUpToSlot(page, fixture);
  await fillGuest(page, guest);

  await page.getByRole("button", { name: /confirmar/i }).first().click();

  // Dos finales válidos, según cómo tenga configurados los cobros el negocio:
  // si pide seña, el turno queda creado y el cliente sale al checkout de
  // MercadoPago; si no, ve la confirmación acá mismo.
  await page.waitForURL(
    (url) => /confirmacion/.test(url.pathname) || /mercadopago|mercadolibre/.test(url.hostname),
    // `commit` and not `load`: the MercadoPago checkout is a heavy third-party
    // page and waiting for it to finish loading is waiting on their servers,
    // not on ours.
    { timeout: 30_000, waitUntil: "commit" }
  );

  // Llegar al checkout con una preferencia es la prueba de que el turno se
  // creó: la preferencia se arma con el id del turno ya guardado.
  if (/mercadopago|mercadolibre/.test(new URL(page.url()).hostname)) {
    expect(page.url(), "el checkout llegó sin preferencia").toMatch(/pref/i);
    return;
  }

  await expect(
    page.getByText(/confirmad|reservad|listo|gracias/i).first(),
    "no apareció la confirmación de la reserva"
  ).toBeVisible({ timeout: 30_000 });
});
