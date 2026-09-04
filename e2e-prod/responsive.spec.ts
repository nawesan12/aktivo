import { test, expect } from "@playwright/test";

/**
 * Horizontal overflow is the failure that matters on a phone: the page scrolls
 * sideways, the layout breaks, and it looks broken rather than tight.
 */
const VIEWPORTS = [
  { name: "iPhone SE", width: 375, height: 667 },
  { name: "iPhone 14 Pro", width: 393, height: 852 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "notebook", width: 1280, height: 800 },
];

const PAGES = ["/", "/explorar", "/iniciar-sesion", "/registrarse"];

for (const vp of VIEWPORTS) {
  for (const path of PAGES) {
    test(`${vp.name} — ${path} no scrollea de costado`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(path, { waitUntil: "networkidle" });

      const overflow = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));

      expect(
        overflow.scrollWidth,
        `${overflow.scrollWidth}px de contenido en ${overflow.clientWidth}px de pantalla`
      ).toBeLessThanOrEqual(overflow.clientWidth + 1);
    });
  }
}
