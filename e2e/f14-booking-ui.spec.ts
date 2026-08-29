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

  await page.getByRole("button", { name: /continuar/i }).click();

  // 5 — resumen y confirmación
  await page.getByRole("button", { name: /confirmar|reservar/i }).last().click();

  await expect(
    page.getByText(/confirmad|reservad|listo|gracias/i).first(),
    "no apareció la confirmación de la reserva"
  ).toBeVisible({ timeout: 30_000 });
});
