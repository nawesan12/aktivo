import { test, expect } from "@playwright/test";
import { loadBookingFixture, testGuest, type BookingFixture } from "./fixtures";

/**
 * The booking wizard as a customer walks it: pick a service, a professional, a
 * time, leave your details, confirm.
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

  await page.goto(`/${fixture.slug}/reservar`);

  // 1 — servicio
  await page.getByText(fixture.service.name, { exact: false }).first().click();

  // 2 — profesional
  await page.getByText(fixture.staff.name, { exact: false }).first().click();

  // 3 — fecha y hora. Se apunta al `data-day` que emite react-day-picker
  // (M/D/YYYY): buscar por el número de día agarraría el mismo número del mes
  // anterior, que aparece en la primera fila y está deshabilitado.
  const [year, month, dayOfMonth] = fixture.date.split("-").map(Number);
  const dayButton = page.locator(`button[data-day="${month}/${dayOfMonth}/${year}"]`);

  await expect(dayButton, `el ${fixture.date} no está en el calendario`).toBeVisible({
    timeout: 15_000,
  });
  await dayButton.click();

  const slot = page.locator(".time-slot-pill:not([disabled])").first();
  await expect(slot, "el día elegido no ofrece horarios").toBeVisible({ timeout: 15_000 });
  await slot.click();

  await page.getByRole("button", { name: /continuar|siguiente/i }).click();

  // 4 — datos
  await page.getByLabel(/nombre/i).or(page.getByPlaceholder(/nombre/i)).first().fill(guest.name);
  await page.getByLabel(/tel|whatsapp/i).or(page.getByPlaceholder(/tel|whatsapp/i)).first().fill(guest.phone);
  // Email is required: it is the only way the customer hears anything back.
  await page.getByLabel(/email/i).or(page.getByPlaceholder(/email/i)).first().fill(guest.email);

  await page.getByRole("button", { name: /continuar/i }).click();

  // 5 — resumen y confirmación
  await page.getByRole("button", { name: /confirmar|reservar/i }).last().click();

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
