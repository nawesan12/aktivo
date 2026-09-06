import { test, expect } from "@playwright/test";
import { SEED, loginAs } from "./helpers";

/**
 * El panel es una aplicación, no un documento.
 *
 * En iOS `100vh` es el alto de la ventana con las barras del sistema
 * retraídas, o sea más que lo que se ve: el body medía más que la pantalla y el
 * documento scrolleaba por debajo del panel, que tiene su propio scroll. Se
 * sentía como dos scrolls peleando, y así lo reportó Nahuel.
 *
 * Esta comprobación es estructural a propósito: con `overflow: hidden` en el
 * documento no puede haber un segundo scroll, cualquiera sea el alto que
 * reporte el navegador. Medir `scrollHeight > clientHeight` no serviría — el
 * navegador de las pruebas usa un viewport fijo, sin las barras que aparecen y
 * desaparecen en un teléfono de verdad, que es donde el problema se ve.
 */
test.describe("F23 — el panel en el teléfono", () => {
  test("sólo el contenido scrollea, no el documento", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAs(page, SEED.owner.email, SEED.owner.password);
    await page.goto("/panel");
    await page.waitForLoadState("networkidle");

    const medidas = await page.evaluate(() => {
      const html = document.documentElement;
      const body = document.body;
      const main = document.getElementById("contenido")!;
      return {
        htmlOverflow: getComputedStyle(html).overflowY,
        htmlScrollea: html.scrollHeight > html.clientHeight + 1,
        bodyScrollea: body.scrollHeight > body.clientHeight + 1,
        mainScrollea: main.scrollHeight > main.clientHeight + 1,
      };
    });

    expect(medidas.htmlOverflow, "el documento puede scrollear detrás del panel").toBe("hidden");
    expect(medidas.htmlScrollea).toBe(false);
    expect(medidas.bodyScrollea).toBe(false);
    // Y el de adentro sí, que es el único que tiene que moverse.
    expect(medidas.mainScrollea).toBe(true);
  });

  test("se llega al final de la lista sin que la barra tape la última fila", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAs(page, SEED.owner.email, SEED.owner.password);
    await page.goto("/panel");
    await page.waitForLoadState("networkidle");

    const ultima = page.locator("#contenido a, #contenido button").last();
    await ultima.scrollIntoViewIfNeeded();

    const tapada = await ultima.evaluate((el) => {
      const r = el.getBoundingClientRect();
      const centro = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
      return !(el.contains(centro) || el === centro);
    });
    expect(tapada, "la última fila queda debajo de la barra de abajo").toBe(false);
  });
});
