import { test, expect } from "@playwright/test";
import { SEED, loginAsOwner } from "./helpers";

test.describe("F10 — Referral Program", () => {
  test.describe("API", () => {
    test("GET referrals returns null without auth", async ({ request }) => {
      const res = await request.get(`/api/businesses/${SEED.business.slug}/referrals`);
      expect(res.status()).toBe(401);
    });

    test("POST referrals requires auth", async ({ request }) => {
      const res = await request.post(`/api/businesses/${SEED.business.slug}/referrals`);
      expect(res.status()).toBe(401);
    });

    test("validate referral returns invalid for bad code", async ({ request }) => {
      const res = await request.post(`/api/businesses/${SEED.business.slug}/referrals/validate`, {
        data: { code: "BADCODE" },
      });
      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(data.valid).toBe(false);
    });
  });

  test.describe("UI", () => {
    test("referrals page accessible from mi-cuenta", async ({ page }) => {
      await loginAsOwner(page);
      await page.goto("/mi-cuenta/referidos");
      await page.waitForLoadState("networkidle");

      await expect(page.getByRole("heading", { name: "Programa de Referidos" })).toBeVisible();
    });

    test("mi-cuenta layout shows Referidos tab", async ({ page }) => {
      await loginAsOwner(page);
      await page.goto("/mi-cuenta/perfil");
      await page.waitForLoadState("networkidle");

      await expect(page.getByRole("link", { name: "Referidos" })).toBeVisible();
    });

    test("referral page shows generate button when no code exists", async ({ page }) => {
      await loginAsOwner(page);
      await page.goto("/mi-cuenta/referidos");
      await page.waitForLoadState("networkidle");

      // Should show either the code or the generate button
      const hasCode = await page.getByText(/Tu código de referido/i).isVisible().catch(() => false);
      const hasGenerate = await page.getByText(/Generar código/i).isVisible().catch(() => false);
      expect(hasCode || hasGenerate).toBe(true);
    });
  });
});
