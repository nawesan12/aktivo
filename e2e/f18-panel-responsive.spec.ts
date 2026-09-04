import { test, expect } from "@playwright/test";
import { SEED, loginAs } from "./helpers";
import { PANEL_NAVIGATION } from "../src/components/layout/navigation";
import { findOverflows } from "./overflow-audit";

/**
 * Every screen of the panel, at the sizes it is actually used on.
 *
 * The public pages have had this check since launch; the panel — where the
 * owner spends their working day, often on a phone between clients — had none.
 * Horizontal overflow is the failure that matters: the layout breaks, controls
 * slide off the edge, and the page reads as broken rather than tight.
 */
const VIEWPORTS = [
  { name: "iPhone SE", width: 375, height: 667 },
  { name: "tablet", width: 768, height: 1024 },
];

test.describe("F18 — el panel entra en la pantalla", () => {
  test.describe.configure({ mode: "serial" });

  for (const viewport of VIEWPORTS) {
    test(`${viewport.name} — ninguna sección scrollea de costado`, async ({ page }) => {
      test.setTimeout(180_000);

      await page.setViewportSize(viewport);
      await loginAs(page, SEED.owner.email, SEED.owner.password);

      const broken: string[] = [];

      for (const item of PANEL_NAVIGATION) {
        await page.goto(item.href);
        await page.waitForLoadState("networkidle");

        const overflow = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
        }));

        // One pixel of slack: sub-pixel rounding on borders is not a bug.
        if (overflow.scrollWidth > overflow.clientWidth + 1) {
          broken.push(
            `${item.href} — ${overflow.scrollWidth}px de contenido en ${overflow.clientWidth}px`
          );
        }

        // And the failure the document-level check cannot see: a row that does
        // not wrap inside a card that clips. The page never scrolls, so this
        // passed for months while filter bars and toggles were cut off the edge
        // of every phone.
        for (const clipped of await findOverflows(page)) {
          broken.push(
            `${item.href} — ${clipped.selector} recorta ${clipped.scrollWidth}px en ${clipped.clientWidth}px`
          );
        }
      }

      // Reported together: fixing them one deploy at a time is how a suite like
      // this gets disabled.
      expect(broken, `secciones que se desbordan:\n  ${broken.join("\n  ")}`).toEqual([]);
    });
  }
});
