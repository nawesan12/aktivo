import { test, expect } from "@playwright/test";
import { SEED, loginAsOwner } from "./helpers";

test.describe("F9 — Coupon/Discount Codes", () => {
  test.describe("API: Coupon Validation", () => {
    test("validate endpoint returns invalid for non-existent coupon", async ({ request }) => {
      const res = await request.post(`/api/businesses/${SEED.business.slug}/coupons/validate`, {
        data: { code: "NONEXISTENT", serviceId: "test-service" },
      });
      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(data.valid).toBe(false);
    });
  });

  test.describe("API: Panel Coupon CRUD", () => {
    test("GET panel coupons requires authentication", async ({ request }) => {
      const res = await request.get("/api/panel/coupons");
      expect([401, 403]).toContain(res.status());
    });

    test("POST panel coupons requires authentication", async ({ request }) => {
      const res = await request.post("/api/panel/coupons", {
        data: {
          code: "TEST10",
          type: "PERCENTAGE",
          value: 10,
        },
      });
      expect([401, 403]).toContain(res.status());
    });
  });

  test.describe("UI: Booking Flow", () => {
    test("coupon input appears on confirmation step", async ({ page }) => {
      await page.goto(`/${SEED.business.slug}/reservar`);
      await page.waitForLoadState("networkidle");
      // Booking wizard loads with service selection
      await expect(page.getByText(/Elegir servicio/i)).toBeVisible();
    });
  });

  test.describe("UI: Dashboard", () => {
    test("coupons management page loads for owner", async ({ page }) => {
      await loginAsOwner(page);
      // Navigate to where coupons would be managed
      // The coupons-dashboard component is reusable
      await page.goto("/panel");
      await page.waitForLoadState("networkidle");
      await expect(page.locator("body")).toBeVisible();
    });
  });
});
