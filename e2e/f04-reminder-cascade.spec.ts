import { test, expect } from "@playwright/test";

test.describe("F4 — Reminder Cascade", () => {
  test("reminders process endpoint returns 401 without secret", async ({ request }) => {
    const res = await request.get("/api/reminders/process");
    expect(res.status()).toBe(401);
  });

  test("reminders process endpoint returns 401 with wrong secret", async ({ request }) => {
    const res = await request.get("/api/reminders/process?secret=wrong-secret");
    expect(res.status()).toBe(401);
  });

  test("reminders process endpoint works with valid secret", async ({ request }) => {
    // Use the REMINDERS_SECRET from env, or test with a known value
    const secret = process.env.REMINDERS_SECRET;
    if (!secret) {
      test.skip();
      return;
    }
    const res = await request.get(`/api/reminders/process?secret=${secret}`);
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data).toHaveProperty("processed");
    expect(typeof data.processed).toBe("number");
  });
});
