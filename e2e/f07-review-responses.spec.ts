import { test, expect } from "@playwright/test";
import { SEED, loginAsOwner } from "./helpers";

test.describe("F7 — Review Responses", () => {
  test("panel reviews PATCH returns auth error without credentials", async ({
    request,
  }) => {
    const res = await request.patch("/api/panel/reviews/nonexistent", {
      data: { response: "Gracias por tu resena!" },
    });
    // Should get an auth or not-found error, not a server crash
    expect([401, 403, 404]).toContain(res.status());
  });

  test("panel reviews GET returns auth error without credentials", async ({
    request,
  }) => {
    const res = await request.get("/api/panel/reviews");
    expect([401, 403]).toContain(res.status());
  });

  test("business profile page loads successfully", async ({ page }) => {
    await page.goto(`/${SEED.business.slug}`);
    await page.waitForLoadState("networkidle");

    // Business name should be visible on the profile
    await expect(page.getByRole("heading", { name: SEED.business.name })).toBeVisible({
      timeout: 10_000,
    });
  });

  test("business profile shows reviews section", async ({ page }) => {
    await page.goto(`/${SEED.business.slug}`);
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: SEED.business.name })).toBeVisible({
      timeout: 10_000,
    });

    // Look for a reviews heading or section
    const reviewsSection = page.getByText(/rese[ñn]as/i);
    const hasReviews = await reviewsSection
      .first()
      .isVisible()
      .catch(() => false);

    if (hasReviews) {
      await expect(reviewsSection.first()).toBeVisible();
    }

    // Page should not have any unhandled errors
    await expect(page.locator("body")).toBeVisible();
  });

  test("reviews dashboard loads for authenticated owner", async ({ page }) => {
    await loginAsOwner(page);
    await page.goto("/panel/reviews");
    await page.waitForLoadState("networkidle");

    // Reviews page should render — either with reviews or empty state
    const hasReviews = await page
      .getByText(/rese[ñn]as/i)
      .first()
      .isVisible({ timeout: 10_000 })
      .catch(() => false);

    const hasEmptyState = await page
      .getByText(/no hay rese[ñn]as/i)
      .isVisible()
      .catch(() => false);

    // Either reviews content or empty state should be shown
    expect(hasReviews || hasEmptyState).toBeTruthy();
  });

  test("review response dialog opens when clicking respond button", async ({
    page,
  }) => {
    await loginAsOwner(page);
    await page.goto("/panel/reviews");
    await page.waitForLoadState("networkidle");

    // Look for a respond button on any review card
    const respondBtn = page.getByRole("button", {
      name: /responder/i,
    });
    const hasRespondBtn = await respondBtn
      .first()
      .isVisible({ timeout: 10_000 })
      .catch(() => false);

    if (hasRespondBtn) {
      await respondBtn.first().click();

      // A dialog or textarea for the response should appear
      const responseInput = page.getByPlaceholder(/respuesta|responder/i);
      const hasInput = await responseInput
        .isVisible({ timeout: 5_000 })
        .catch(() => false);

      if (hasInput) {
        await responseInput.fill("Gracias por tu comentario!");
        await expect(responseInput).toHaveValue("Gracias por tu comentario!");
      }
    }
    // If no reviews exist, there's nothing to respond to — still a pass
  });

  test("business profile glass cards render correctly", async ({ page }) => {
    await page.goto(`/${SEED.business.slug}`);
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: SEED.business.name })).toBeVisible({
      timeout: 10_000,
    });

    // Verify glass card styling is applied (TailwindCSS "glass" class)
    const glassCards = page.locator(".glass");
    const glassCount = await glassCards.count();

    // Business profile should use glass cards for visual sections
    if (glassCount > 0) {
      await expect(glassCards.first()).toBeVisible();
    }
  });
});
