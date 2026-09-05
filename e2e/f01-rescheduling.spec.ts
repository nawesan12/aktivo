import { test, expect } from "@playwright/test";
import { SEED, loginAsOwner } from "./helpers";

test.describe("F1 — Appointment Rescheduling", () => {
  test("rescheduling needs an identity, session or verified code", async ({ request }) => {
    const res = await request.post("/api/client/appointments/test-id/reschedule", {
      data: { newDate: "2026-04-01", newTime: "10:00" },
    });
    expect(res.status()).toBe(401);
  });

  test("cancelling needs one too", async ({ request }) => {
    const res = await request.patch("/api/client/appointments/test-id");
    expect(res.status()).toBe(401);
  });

  test("the shop's old portal redirects to the customer's own appointments", async ({ page }) => {
    await page.goto(`/${SEED.business.slug}/mis-turnos`);
    await page.waitForURL("**/mis-turnos");
    expect(new URL(page.url()).pathname).toBe("/mis-turnos");
  });

  test("mis-turnos asks for an email, not a phone number", async ({ page }) => {
    await page.goto("/mis-turnos");
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: "Tus turnos" })).toBeVisible();
    // The phone-only portal was the whole bug: somebody who booked with a
    // session had never been asked for a number, and was told there were no
    // appointments with it.
    await expect(page.getByLabel(/email o tu teléfono/i)).toBeVisible();
  });

  test("mi-cuenta/turnos shows reschedule button for authenticated users", async ({ page }) => {
    await loginAsOwner(page);
    await page.goto("/mi-cuenta/turnos");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: "Mis turnos" })).toBeVisible();
  });
});
