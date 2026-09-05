import { test, expect } from "@playwright/test";

import { TEST_BUSINESS_PREFIX } from "./fixtures";

/**
 * Dar de alta un local y que quede utilizable de verdad.
 *
 * El alta terminaba con la agenda abierta y el link listo, pero sin haber
 * preguntado nunca dónde queda el local: quien abría ese link veía servicios y
 * horarios y no tenía forma de saber a qué dirección ir. Sin `city`, además, el
 * negocio quedaba fuera del directorio por ciudad aunque estuviera tomando
 * reservas.
 *
 * `scripts/e2e-cleanup.ts` borra los negocios con este prefijo. Sin eso, cada
 * corrida deja uno publicado en el directorio y en el sitemap.
 */
const nombre = `${TEST_BUSINESS_PREFIX}${Date.now().toString().slice(-6)}`;

test.describe("F22 — el alta de un negocio", () => {
  test("pide dónde queda el local, y eso llega a su página", async ({ page }) => {
    await page.goto("/registrarse");

    await page.getByLabel(/tu nombre/i).fill("Dueño E2E");
    await page.getByLabel(/tu negocio/i).fill(nombre);
    await page.getByLabel("Email", { exact: true }).fill(`${nombre}@jikuapp.test`);
    await page.getByLabel("Contraseña", { exact: true }).fill("prueba1234");
    await page.getByLabel(/repetí la contraseña/i).fill("prueba1234");
    await page.getByRole("button", { name: /crear mi cuenta/i }).click();

    await page.waitForURL("**/panel/bienvenida", { timeout: 40_000 });

    // Lo que faltaba: sin estos dos campos el local salía publicado sin decir
    // dónde está.
    const direccion = page.getByLabel(/dónde están/i);
    const ciudad = page.getByLabel("Ciudad", { exact: true });
    await expect(direccion).toBeVisible({ timeout: 20_000 });
    await expect(ciudad).toBeVisible();

    await page.getByLabel(/qué hacen/i).fill("Local de prueba automática.");
    await page.getByLabel(/teléfono o whatsapp/i).fill("2234999888");
    await direccion.fill("San Martín 2500");
    await ciudad.fill("Mar del Plata");

    // No se puede seguir sin decir dónde queda.
    await page.getByRole("button", { name: /continuar/i }).click();
    await expect(page.getByLabel(/^servicio$/i)).toBeVisible({ timeout: 20_000 });

    await page.getByLabel(/^servicio$/i).fill("Corte");
    await page.getByLabel(/cuánto sale/i).fill("8000");
    await page.getByRole("button", { name: /continuar/i }).click();

    await expect(page.getByRole("button", { name: /continuar/i })).toBeVisible({
      timeout: 20_000,
    });
    await page.getByRole("button", { name: /continuar/i }).click();
    await expect(page.getByText(/tu agenda está abierta/i)).toBeVisible({ timeout: 30_000 });

    // Y del otro lado: lo que ve quien abre el link.
    const slug = nombre.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    await page.goto(`/${slug}`);
    // `.first()`: la dirección sale dos veces, bajo el nombre y al pie del mapa.
    await expect(page.getByText(/San Mart.n 2500/).first()).toBeVisible({ timeout: 20_000 });
    // El número se guarda también como WhatsApp: la etiqueta dice "Teléfono o
    // WhatsApp", y guardándolo sólo como teléfono el botón no aparecía nunca.
    await expect(page.getByRole("link", { name: /whatsapp/i })).toBeVisible();
  });
});
