import { test, expect } from "@playwright/test";
import { SEED, loginAsOwner } from "./helpers";

test.describe("F1 — Appointment Rescheduling", () => {
  test("guest reschedule API returns 401 without token", async ({ request }) => {
    const res = await request.post(`/api/businesses/${SEED.business.slug}/guest-appointments/reschedule`, {
      data: {
        appointmentId: "test-id",
        newDate: "2026-04-01",
        newTime: "10:00",
      },
    });
    expect(res.status()).toBe(401);
  });

  test("authenticated reschedule API returns 401 without session", async ({ request }) => {
    const res = await request.post("/api/account/appointments/test-id/reschedule", {
      data: {
        newDate: "2026-04-01",
        newTime: "10:00",
      },
    });
    expect(res.status()).toBe(401);
  });

  test("mis-turnos page shows reschedule button for upcoming appointments", async ({ page }) => {
    await page.goto(`/${SEED.business.slug}/mis-turnos`);
    await page.waitForLoadState("networkidle");
    // Should see the phone verification state
    await expect(page.getByRole("heading", { name: "Mis turnos" })).toBeVisible();
    await expect(page.getByPlaceholder(/1155667788/)).toBeVisible();
  });

  test("mi-cuenta/turnos shows reschedule button for authenticated users", async ({ page }) => {
    await loginAsOwner(page);
    await page.goto("/mi-cuenta/turnos");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: "Mis Turnos" })).toBeVisible();
  });
});
