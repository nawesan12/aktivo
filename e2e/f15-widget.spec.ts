import { test, expect } from "@playwright/test";
import { loadBookingFixture, testGuest, type BookingFixture } from "./fixtures";

/**
 * The embeddable widget — the version of the product that runs on our
 * customers' own websites.
 *
 * It posted to an endpoint that does not exist and swallowed the 404, so
 * pressing "Confirmar Turno" did nothing at all, without a message. Nothing
 * covered it, because the existing spec only checked that the iframe rendered.
 */

let fixture: BookingFixture;

test.beforeAll(async ({ request }) => {
  fixture = await loadBookingFixture(request);
});

test("el widget no carga el service worker ni la sesión de la app", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (r) => requests.push(r.url()));

  await page.goto(`/embed/${fixture.slug}`);
  await page.waitForLoadState("networkidle");

  // Esto corre en el sitio del cliente: registrar un service worker en su
  // origen, o consultar nuestra sesión, no le corresponde.
  expect(requests.filter((u) => u.includes("/sw.js"))).toEqual([]);
  expect(requests.filter((u) => u.includes("/api/auth/session"))).toEqual([]);
});

test("un visitante reserva desde el widget", async ({ page }) => {
  const guest = testGuest("201");

  await page.goto(`/embed/${fixture.slug}`);

  await page.getByText(fixture.service.name, { exact: false }).first().click();
  await page.getByText(fixture.staff.name, { exact: false }).first().click();

  await page.locator('input[type="date"]').fill(fixture.date);

  const slot = page.locator("button").filter({ hasText: /^\d{2}:\d{2}$/ }).first();
  await expect(slot, "el widget no ofrece horarios").toBeVisible({ timeout: 20_000 });
  await slot.click();

  await page.getByPlaceholder(/nombre/i).or(page.locator("input").nth(0)).first().fill(guest.name);
  await page.getByPlaceholder(/tel|whatsapp/i).or(page.locator('input[type="tel"]')).first().fill(guest.phone);
  await page.locator('input[type="email"]').first().fill(guest.email);

  await page.getByRole("button", { name: /confirmar turno/i }).click();

  await expect(
    page.getByText(/turno reservado/i),
    "el widget no confirmó la reserva"
  ).toBeVisible({ timeout: 30_000 });
});
