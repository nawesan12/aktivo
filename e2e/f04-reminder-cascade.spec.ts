import { test, expect } from "@playwright/test";

/**
 * Scheduled jobs authenticate with `Authorization: Bearer <CRON_SECRET>`,
 * not a query string (which would leak the secret into access logs and Referer
 * headers). They are wired to real schedules in vercel.json.
 */
const CRON_JOBS = [
  "/api/cron/reminders",
  "/api/cron/expire-bookings",
  "/api/cron/no-shows",
];

test.describe("F4 — Cron endpoints", () => {
  for (const path of CRON_JOBS) {
    test(`${path} rejects requests without a secret`, async ({ request }) => {
      const res = await request.get(path);
      expect(res.status()).toBe(401);
    });

    test(`${path} rejects a wrong secret`, async ({ request }) => {
      const res = await request.get(path, {
        headers: { Authorization: "Bearer wrong-secret" },
      });
      expect(res.status()).toBe(401);
    });

    test(`${path} ignores the secret in the query string`, async ({ request }) => {
      // The old endpoint accepted ?secret=... — make sure that door stays shut.
      const secret = process.env.CRON_SECRET ?? process.env.REMINDERS_SECRET;
      test.skip(!secret, "CRON_SECRET not set");

      const res = await request.get(`${path}?secret=${secret}`);
      expect(res.status()).toBe(401);
    });
  }

  test("reminders reports how many were sent", async ({ request }) => {
    const secret = process.env.CRON_SECRET ?? process.env.REMINDERS_SECRET;
    test.skip(!secret, "CRON_SECRET not set");

    const res = await request.get("/api/cron/reminders", {
      headers: { Authorization: `Bearer ${secret}` },
    });

    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data).toHaveProperty("sent");
    expect(typeof data.sent).toBe("number");
    expect(data).toHaveProperty("due");
  });

  test("expire-bookings reports how many were released", async ({ request }) => {
    const secret = process.env.CRON_SECRET ?? process.env.REMINDERS_SECRET;
    test.skip(!secret, "CRON_SECRET not set");

    const res = await request.get("/api/cron/expire-bookings", {
      headers: { Authorization: `Bearer ${secret}` },
    });

    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(typeof data.expired).toBe("number");
  });
});
