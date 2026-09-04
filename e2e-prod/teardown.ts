import { execFileSync } from "node:child_process";

/**
 * Deletes the business the smoke run created.
 *
 * Runs as its own process because Playwright cannot import the Prisma client,
 * the same reason `scripts/e2e-cleanup.ts` exists. It reads the same
 * `DATABASE_URL` the run was pointed at, so it can never touch a database the
 * operator did not choose.
 */
export default function globalTeardown() {
  try {
    const output = execFileSync("npx", ["tsx", "scripts/prod-smoke-cleanup.ts"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    process.stdout.write(output);
  } catch (error) {
    // A failed cleanup must not turn a green smoke run red — but it has to be
    // loud, because what it leaves behind is visible to the public.
    console.error("FALLÓ la limpieza del negocio de prueba. Corré a mano:");
    console.error("  npx tsx scripts/prod-smoke-cleanup.ts");
    console.error(error instanceof Error ? error.message : error);
  }
}
