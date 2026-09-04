import { defineConfig, devices } from "@playwright/test";

/**
 * Smoke test against the deployed site. No local server involved.
 *
 * It registers a real business in the live database, so it tears that business
 * down when the run ends. Without the teardown every run left another
 * "Barberia Prueba …" in the public directory and in the sitemap — five runs in
 * one day, and the entire directory a real visitor saw was fake shops.
 */
export default defineConfig({
  testDir: "./e2e-prod",
  globalTeardown: "./e2e-prod/teardown.ts",
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  timeout: 180_000,
  expect: { timeout: 20_000 },
  use: {
    baseURL: process.env.BASE_URL || "https://jikuapp.com",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    actionTimeout: 20_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
