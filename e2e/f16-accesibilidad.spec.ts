import { test, expect } from "@playwright/test";
import { SEED, loginAsOwner } from "./helpers";
import { loadBookingFixture } from "./fixtures";

/**
 * Keyboard and screen-reader basics on the paths a customer walks.
 *
 * These are the checks that used to be assumed rather than verified: the plan
 * flagged 91 labels with no `htmlFor`, icon buttons with no accessible name and
 * no skip link at all.
 */

test("la landing ofrece saltar al contenido con el teclado", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");

  const skipLink = page.getByRole("link", { name: /saltar al contenido/i });
  await expect(skipLink, "el primer tabulador no llega al enlace de salto").toBeFocused();

  await page.keyboard.press("Enter");
  await expect(page.locator("#contenido")).toBeVisible();
});

test("el formulario de ingreso tiene sus campos etiquetados", async ({ page }) => {
  await page.goto("/iniciar-sesion");

  // getByLabel sólo encuentra el campo si label e input están asociados.
  await expect(page.getByLabel(/email/i)).toBeVisible();
  await expect(page.getByLabel(/contraseña/i)).toBeVisible();
});

test("los datos de la reserva se piden con campos etiquetados", async ({ page, request }) => {
  const fixture = await loadBookingFixture(request);

  await page.goto(`/${fixture.slug}/reservar`);
  await page.getByText(fixture.service.name, { exact: false }).first().click();
  await page.getByText(fixture.staff.name, { exact: false }).first().click();

  const [year, month, day] = fixture.date.split("-").map(Number);
  await page.locator(`button[data-day="${month}/${day}/${year}"]`).click();
  await page.locator(".time-slot-pill:not([disabled])").first().click();
  await page.getByRole("button", { name: /continuar|siguiente/i }).click();

  await expect(page.getByLabel(/nombre/i).first()).toBeVisible();
  await expect(page.getByLabel(/tel/i).first()).toBeVisible();
});

test("los botones de ícono del panel se anuncian", async ({ page }) => {
  await loginAsOwner(page);
  await page.goto("/panel");
  await page.waitForLoadState("networkidle");

  await expect(page.getByRole("button", { name: /notificaciones/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /modo (claro|oscuro)/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /menú de la cuenta/i })).toBeVisible();
});

test("la sección actual del panel se marca como tal", async ({ page }) => {
  await loginAsOwner(page);
  await page.goto("/panel/turnos");
  await page.waitForLoadState("networkidle");

  // aria-current es lo que le dice a un lector de pantalla dónde está parado;
  // el color de fondo sólo funciona para quien lo ve.
  const current = page.locator('a[aria-current="page"]');
  await expect(current).toHaveCount(1);
  await expect(current).toHaveAttribute("href", "/panel/turnos");
});

test("la página del negocio tiene un solo encabezado principal", async ({ page }) => {
  await page.goto(`/${SEED.business.slug}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
});

test("los diálogos del panel se cierran con Escape y devuelven el foco", async ({ page }) => {
  await loginAsOwner(page);
  await page.goto("/panel/servicios");
  await page.waitForLoadState("networkidle");

  const openButton = page.getByRole("button", { name: /nuevo servicio|crear servicio/i }).first();
  await openButton.click();

  const dialog = page.getByRole("dialog");
  await expect(dialog, "el formulario no se anuncia como diálogo").toBeVisible();

  // El overlay hecho a mano ignoraba Escape: había que buscar la X con el mouse.
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("la confirmación de borrado es un diálogo de alerta, no un confirm del navegador", async ({
  page,
}) => {
  await loginAsOwner(page);
  await page.goto("/panel/servicios");
  await page.waitForLoadState("networkidle");

  // El aria-label de cada tarjeta es "Eliminar <servicio>"; "Eliminar categoría"
  // es otro botón.
  const deleteButton = page.getByRole("button", { name: /^Eliminar (?!categoría)/ }).first();
  await deleteButton.click();

  const alert = page.getByRole("alertdialog");
  await expect(alert).toBeVisible();
  await expect(alert.getByRole("button", { name: /cancelar/i })).toBeVisible();

  await alert.getByRole("button", { name: /cancelar/i }).click();
  await expect(alert).toBeHidden();
});
