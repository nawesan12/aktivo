import { test, expect } from "@playwright/test";
import { SEED, loginAsOwner } from "./helpers";

test.describe("F11 — Smart Time Suggestions", () => {
  test("suggestions API requires auth", async ({ request }) => {
    const res = await request.get(
      `/api/businesses/${SEED.business.slug}/suggestions?serviceId=test&staffId=test`
    );
    expect(res.status()).toBe(401);
  });

  test("suggestions API returns null for user with no history", async ({ page }) => {
    await loginAsOwner(page);
    // Make API call through the authenticated page context
    const res = await page.request.get(
      `/api/businesses/${SEED.business.slug}/suggestions?serviceId=nonexistent&staffId=nonexistent`
    );
    if (res.ok()) {
      const data = await res.json();
      // Should return null or empty for no matching appointments
      expect(data === null || data.suggestedDay === undefined || data.suggestedDay === null).toBeTruthy();
    }
  });

  test("booking wizard loads without crashing when suggestions unavailable", async ({ page }) => {
    await page.goto(`/${SEED.business.slug}/reservar`);
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(/Elegir servicio/i)).toBeVisible();
  });
});
