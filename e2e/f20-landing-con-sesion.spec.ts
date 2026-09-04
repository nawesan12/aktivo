import { test, expect } from "@playwright/test";
import { SEED, loginAs } from "./helpers";

/**
 * The sales page is for people who have not bought yet.
 *
 * Someone signed in who lands on "/" — from a bookmark, from the logo, from an
 * old tab — came to work, and showing them "Probá gratis 7 días" is showing
 * them an ad for what they already have.
 */
test.describe("F20 — con sesión iniciada no se ve la landing", () => {
  test("al dueño lo manda a su panel", async ({ page }) => {
    await loginAs(page, SEED.owner.email, SEED.owner.password);

    await page.goto("/");
    await expect(page).toHaveURL(/\/panel/);
  });

  test("al admin de plataforma lo manda al admin", async ({ page }) => {
    await loginAs(page, SEED.admin.email, SEED.admin.password);

    await page.goto("/");
    await expect(page).toHaveURL(/\/admin/);
  });

  test("sin sesión la landing se ve, y sigue siendo estática", async ({ page, request }) => {
    // The redirect is gated on the session cookie in the proxy matcher, so an
    // anonymous visit must not even reach the function — that is what keeps the
    // busiest page a CDN hit instead of an invocation per visitor.
    const response = await request.get("/");
    expect(response.status()).toBe(200);

    await page.goto("/");
    await expect(page).toHaveURL(/\/$/);
  });
});
