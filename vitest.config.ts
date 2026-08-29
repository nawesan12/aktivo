import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    setupFiles: ["./vitest.setup.ts"],
    // Playwright specs live in e2e/ and are run by Playwright, not Vitest.
    include: ["src/**/*.test.ts"],
  },
});
