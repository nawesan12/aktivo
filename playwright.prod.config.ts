import { defineConfig, devices } from "@playwright/test";

/** Smoke test against the deployed site. No local server involved. */
export default defineConfig({
  testDir: "./e2e-prod",
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
