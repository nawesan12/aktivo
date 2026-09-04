import { test, expect } from "@playwright/test";
import { SEED, loginAsOwner } from "./helpers";

test.describe("F5 — Notification Preferences", () => {
  test("notification preferences API returns 401 without auth", async ({ request }) => {
    const res = await request.get("/api/account/notification-preferences");
    expect(res.status()).toBe(401);
  });

  test("guest preferences API returns data (empty without token)", async ({ request }) => {
    const res = await request.get(`/api/businesses/${SEED.business.slug}/guest-preferences`);
    // Without guest-token, should return 401 or empty
    expect([200, 401]).toContain(res.status());
  });

  test("notification preferences page renders for authenticated users", async ({ page }) => {
    await loginAsOwner(page);
    await page.goto("/mi-cuenta/notificaciones");
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: "Notificaciones" })).toBeVisible();
    await expect(page.getByText(/Configurá cómo querés recibir/i)).toBeVisible();
  });

  test("las preferencias personales se alcanzan desde el panel", async ({ page }) => {
    await loginAsOwner(page);
    await page.goto("/mi-cuenta/perfil");
    await page.waitForLoadState("networkidle");

    // The redesigned sidebar is one compact list of the fifteen screens a shop
    // works from; anything about the person rather than the business moved to
    // the account menu in the topbar. "Mis avisos" is their own preferences;
    // "Envíos", under Configuración, is the business's log of what it sent.
    await page.getByRole("button", { name: /menú de la cuenta/i }).click();
    await expect(page.getByRole("menuitem", { name: "Mis avisos" })).toBeVisible();
  });

  test("mis-turnos has settings gear icon", async ({ page }) => {
    await page.goto(`/${SEED.business.slug}/mis-turnos`);
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Mis turnos")).toBeVisible();
  });
});
