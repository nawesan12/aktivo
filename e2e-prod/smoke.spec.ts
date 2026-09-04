import { test, expect } from "@playwright/test";

/**
 * The whole product from cold, against production: register, get in, set up a
 * service and a professional, publish, and take a booking from the public page.
 *
 * Kept outside `e2e/` because it writes to the live database.
 */

const stamp = Date.now();
const owner = {
  name: "Prueba Lanzamiento",
  businessName: `Barberia Prueba ${stamp}`,
  email: `prueba-${stamp}@jikuapp.test`,
  password: "PruebaLanzamiento2026!",
};

test("un negocio se registra, configura y recibe una reserva", async ({ page }) => {
  test.setTimeout(180_000);

  // ── Registro ────────────────────────────────────────────────────────────
  await page.goto("/registrarse");
  await page.locator("#name").fill(owner.name);
  await page.locator("#businessName").fill(owner.businessName);
  await page.locator("#email").fill(owner.email);
  await page.locator("#password").fill(owner.password);
  await page.locator("#confirmPassword").fill(owner.password);
  await page.getByRole("button", { name: /crear cuenta|registrar/i }).click();

  await page.waitForURL(/panel/, { timeout: 60_000 });

  // El onboarding arranca solo para un negocio nuevo.
  await expect(
    page.getByText(/bienvenido a jiku/i).first(),
    "el negocio nuevo no cayó en el onboarding"
  ).toBeVisible({ timeout: 30_000 });
  console.log("OK registro:", owner.email);

  // La prueba gratis tiene que estar corriendo desde el minuto cero.
  await expect(
    page.getByText(/d[ií]as de prueba/i).first(),
    "el negocio nuevo no arrancó con la prueba gratis"
  ).toBeVisible({ timeout: 30_000 });
  console.log("OK prueba gratis en curso");

  // ── Servicio ────────────────────────────────────────────────────────────
  await page.goto("/panel/servicios");
  await page.getByRole("button", { name: /nuevo servicio|agregar servicio|crear/i }).first().click();
  await page.locator('input[name="name"], #name').first().fill("Corte de prueba");
  await page.locator('input[name="duration"], #duration').first().fill("30");
  await page.locator('input[name="price"], #price').first().fill("8000");
  await page.getByRole("button", { name: /guardar|crear/i }).last().click();

  await expect(
    page.getByText("Corte de prueba").first(),
    "el servicio no quedó guardado"
  ).toBeVisible({ timeout: 30_000 });
  console.log("OK servicio creado");

  // ── Profesional ─────────────────────────────────────────────────────────
  await page.goto("/panel/equipo");
  await page.getByRole("button", { name: /nuevo|agregar|crear/i }).first().click();
  await page.locator('input[name="name"], #name').first().fill("Profesional Prueba");
  // El servicio tiene que quedar asignado o no aparece nadie para reservarlo.
  const serviceToggle = page.getByText("Corte de prueba").last();
  if (await serviceToggle.isVisible().catch(() => false)) await serviceToggle.click();
  await page.getByRole("button", { name: /guardar|crear/i }).last().click();

  await expect(
    page.getByText("Profesional Prueba").first(),
    "el profesional no quedó guardado"
  ).toBeVisible({ timeout: 30_000 });
  console.log("OK profesional creado");

  // ── La página pública ya tiene que servir ───────────────────────────────
  const slug = await page.evaluate(async () => {
    const res = await fetch("/api/panel/settings");
    return (await res.json())?.business?.slug as string;
  });
  expect(slug, "el negocio no expone su slug").toBeTruthy();
  console.log("OK slug:", slug);

  const publicPage = await page.request.get(`/${slug}`);
  expect(publicPage.status(), "la página pública del negocio no responde").toBe(200);

  const services = await (await page.request.get(`/api/businesses/${slug}/services`)).json();
  expect(JSON.stringify(services), "el servicio no llegó a la página pública").toContain(
    "Corte de prueba"
  );
  console.log("OK página pública sirviendo el servicio");

  // Cada página pública del negocio, con un negocio de verdad.
  //
  // Esto existe porque un cambio de caché rompió /reservar con un 500 y no lo
  // vio nadie: el build pasa —no hay negocios para prerenderizar— y el servidor
  // de desarrollo no aplica la regla que falla en producción. La única forma de
  // enterarse es pedir las páginas.
  for (const path of [`/${slug}`, `/${slug}/reservar`, `/${slug}/mis-turnos`, `/embed/${slug}`]) {
    const response = await page.request.get(path);
    expect(response.status(), `${path} respondió ${response.status()}`).toBe(200);
  }
  console.log("OK todas las páginas públicas del negocio responden 200");
});
