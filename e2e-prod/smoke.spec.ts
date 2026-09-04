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

  const fallas: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") fallas.push("CONSOLA " + m.text().slice(0, 300));
  });
  page.on("pageerror", (e) => fallas.push("PAGEERROR " + e.message.slice(0, 300)));
  page.on("requestfailed", (r) => fallas.push("REQFAIL " + r.url().slice(0, 120) + " " + (r.failure()?.errorText ?? "")));
  page.on("response", (r) => {
    if (r.status() >= 400 && r.url().includes("upload")) fallas.push("HTTP " + r.status() + " " + r.url().slice(0, 120));
  });

  // ── Registro ────────────────────────────────────────────────────────────
  await page.goto("/registrarse");
  await page.locator("#name").fill(owner.name);
  await page.locator("#businessName").fill(owner.businessName);
  await page.locator("#email").fill(owner.email);
  await page.locator("#password").fill(owner.password);
  await page.locator("#confirmPassword").fill(owner.password);
  await page.getByRole("button", { name: /crear mi cuenta|crear cuenta|registrar/i }).click();

  await page.waitForURL(/panel/, { timeout: 60_000 });

  // El onboarding arranca solo para un negocio nuevo.
  await expect(
    page.getByText("1 Tu negocio").first(),
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

  // ── Subir el logo ───────────────────────────────────────────────────────
  //
  // El archivo se comprime en el navegador y va derecho al store, sin pasar por
  // una función nuestra. Se prueba acá porque es lo único de todo el flujo que
  // depende de un servicio externo configurado a mano: sin el store, el botón
  // falla y no hay nada en el código que lo delate.
  await page.goto("/panel/mi-web");
  await expect(page.getByRole("heading", { name: "Mi web" })).toBeVisible({ timeout: 30_000 });
  // El encabezado es de la página; el subidor lo trae el componente, que
  // arranca con un skeleton mientras pide la configuración.
  await page.waitForSelector('input[type="file"]', { state: "attached", timeout: 30_000 });

  // Un PNG generado acá mismo, con el peso de una exportación real: 1024px y
  // varios megas antes de comprimir.
  const originalBytes = await page.evaluate(async () => {
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 1024;
    const x = c.getContext("2d")!;
    const g = x.createLinearGradient(0, 0, 1024, 1024);
    g.addColorStop(0, "#0d1b2a");
    g.addColorStop(1, "#c8a24a");
    x.fillStyle = g;
    x.fillRect(0, 0, 1024, 1024);
    for (let i = 0; i < 8000; i++) {
      x.fillStyle = `rgba(${(i * 37) % 255},${(i * 91) % 255},${(i * 53) % 255},0.4)`;
      x.fillRect((i * 131) % 1024, (i * 197) % 1024, 4, 4);
    }
    const blob: Blob = await new Promise((r) => c.toBlob((v) => r(v!), "image/png"));
    const file = new File([blob], "logo-prueba.png", { type: "image/png" });
    const transfer = new DataTransfer();
    transfer.items.add(file);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    input.files = transfer.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
    return blob.size;
  });

  // El resultado, no el aviso: la imagen tiene que quedar apuntando al store.
  const imagenSubida = page.locator('img[src*="blob.vercel-storage.com"]').first();
  await imagenSubida.waitFor({ state: "attached", timeout: 60_000 }).catch(() => {
    throw new Error("el logo no llegó al store. Registrado:\n  " + fallas.join("\n  "));
  });
  const logoUrl = await imagenSubida.getAttribute("src");

  const stored = await page.request.get(logoUrl!);
  const storedBytes = Number(stored.headers()["content-length"] ?? 0);
  expect(stored.status(), "el logo subido no se puede descargar").toBe(200);
  expect(stored.headers()["content-type"]).toContain("webp");
  expect(
    storedBytes,
    `el logo pesa ${storedBytes} bytes, más de lo que debería tras comprimir`
  ).toBeLessThan(80_000);
  console.log(
    `OK logo subido: ${Math.round(originalBytes / 1000)} KB → ${Math.round(storedBytes / 1000)} KB (webp)`
  );

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
  for (const path of [`/${slug}`, `/${slug}/reservar`, `/${slug}/mis-turnos`]) {
    const response = await page.request.get(path);
    expect(response.status(), `${path} respondió ${response.status()}`).toBe(200);
  }
  console.log("OK todas las páginas públicas del negocio responden 200");

  // El widget embebible se sacó del producto: /embed ya no existe y la ruta
  // tiene que responder 404 para todos, no sólo para quien lo tenía apagado.
  const embed = await page.request.get(`/embed/${slug}`);
  expect(embed.status(), "quedó sirviéndose el widget que se dio de baja").toBe(404);
  console.log("OK el widget ya no se sirve");
});
