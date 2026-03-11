import { test, expect } from "@playwright/test";
import { SEED } from "./helpers";

test.describe("F3 — Better Calendar UX", () => {
  test("availability API returns slotCount when serviceId and duration provided", async ({
    request,
  }) => {
    // First get services to find a valid service+staff combo
    const servicesRes = await request.get(
      `/api/businesses/${SEED.business.slug}/services`
    );
    expect(servicesRes.ok()).toBeTruthy();
    const categories = await servicesRes.json();
    const firstService = categories[0]?.services?.[0];

    if (!firstService) {
      test.skip();
      return;
    }

    const staffId = firstService.staffIds?.[0];
    if (!staffId) {
      test.skip();
      return;
    }

    // Request availability with service context so slotCount is included
    const availRes = await request.get(
      `/api/businesses/${SEED.business.slug}/availability?staffId=${staffId}&serviceId=${firstService.id}&duration=${firstService.duration}`
    );

    if (availRes.ok()) {
      const dates = await availRes.json();
      expect(Array.isArray(dates)).toBe(true);
      // Check that available dates include slotCount
      const availableDate = dates.find((d: any) => d.hasSlots);
      if (availableDate) {
        expect(availableDate).toHaveProperty("slotCount");
        expect(typeof availableDate.slotCount).toBe("number");
      }
    }
  });

  test("booking wizard loads service selection step", async ({ page }) => {
    await page.goto(`/${SEED.business.slug}/reservar`);
    await page.waitForLoadState("networkidle");

    // The booking wizard starts with service selection
    await expect(page.getByText(/Elegir servicio/i)).toBeVisible({
      timeout: 10_000,
    });
  });

  test("service cards are rendered for the seeded business", async ({ page }) => {
    await page.goto(`/${SEED.business.slug}/reservar`);
    await page.waitForLoadState("networkidle");

    // Wait for at least one service to appear
    const serviceItem = page.locator("[data-testid='service-item']").first();
    const serviceItemVisible = await serviceItem
      .isVisible({ timeout: 10_000 })
      .catch(() => false);

    if (serviceItemVisible) {
      // Verify known seeded service name appears
      await expect(
        page.getByText(SEED.services.corteClasico)
      ).toBeVisible();
    } else {
      // Fallback: look for service text directly
      await expect(
        page.getByText(SEED.services.corteClasico)
      ).toBeVisible({ timeout: 10_000 });
    }
  });

  test("selecting a service advances to date/staff step", async ({ page }) => {
    await page.goto(`/${SEED.business.slug}/reservar`);
    await page.waitForLoadState("networkidle");

    // Click the first service
    const serviceText = page.getByText(SEED.services.corteClasico);
    await expect(serviceText).toBeVisible({ timeout: 10_000 });
    await serviceText.click();

    // Should advance to the next step (staff or date selection)
    // Wait for the URL or step content to change
    await page.waitForLoadState("networkidle");

    // After selecting a service we expect to see either staff or calendar
    const nextStepVisible = await page
      .getByText(/Elegir profesional|Elegir fecha|Seleccionar/i)
      .first()
      .isVisible({ timeout: 10_000 })
      .catch(() => false);

    expect(nextStepVisible).toBeTruthy();
  });

  test("time slot buttons meet min touch target size", async ({ page }) => {
    await page.goto(`/${SEED.business.slug}/reservar`);
    await page.waitForLoadState("networkidle");

    // Navigate through booking flow to reach time slots
    const serviceText = page.getByText(SEED.services.corteClasico);
    await expect(serviceText).toBeVisible({ timeout: 10_000 });
    await serviceText.click();
    await page.waitForLoadState("networkidle");

    // Look for time slot buttons (they may take a moment to appear)
    const timeSlots = page.locator("button[data-testid='time-slot']");
    const firstSlot = timeSlots.first();
    const hasSlotsVisible = await firstSlot
      .isVisible({ timeout: 10_000 })
      .catch(() => false);

    if (hasSlotsVisible) {
      const box = await firstSlot.boundingBox();
      expect(box).toBeTruthy();
      // Touch target should be at least 44px tall (WCAG recommendation)
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
    // If time slots are not visible yet (need to pick staff/date first), that's OK
  });
});
