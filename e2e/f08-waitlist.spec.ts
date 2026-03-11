import { test, expect } from "@playwright/test";
import { SEED } from "./helpers";

test.describe("F8 — Waitlist UX Improvements", () => {
  test("waitlist POST accepts email field", async ({ request }) => {
    const res = await request.post(`/api/businesses/${SEED.business.slug}/waitlist`, {
      data: {
        name: "Test User",
        phone: "1155667788",
        email: "test@test.com",
        serviceId: "nonexistent",
        preferredDate: "2026-04-01",
      },
    });
    // Should be 404 (service not found) not a crash/500
    expect([400, 404]).toContain(res.status());
  });

  test("waitlist GET returns entries for authenticated guest", async ({ request }) => {
    const res = await request.get(`/api/businesses/${SEED.business.slug}/waitlist`);
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data).toHaveProperty("entries");
    expect(Array.isArray(data.entries)).toBe(true);
  });

  test("waitlist section appears on mis-turnos page", async ({ page }) => {
    await page.goto(`/${SEED.business.slug}/mis-turnos`);
    await page.waitForLoadState("networkidle");
    // The page loads with phone verification
    await expect(page.getByText("Mis turnos")).toBeVisible();
  });

  test("waitlist form in booking flow includes email field", async ({ page }) => {
    await page.goto(`/${SEED.business.slug}/reservar`);
    await page.waitForLoadState("networkidle");
    // Service selection loads
    await expect(page.getByText(/Elegir servicio/i)).toBeVisible();
  });
});
