import { execFileSync } from "node:child_process";

/**
 * Deletes the business the smoke run created.
 *
 * Runs as its own process because Playwright cannot import the Prisma client,
 * the same reason `scripts/e2e-cleanup.ts` exists.
 *
 * `PROD_DATABASE_URL` has to be set explicitly. The suite runs against
 * jikuapp.com while the local `.env` points at the development branch, so
 * inheriting `DATABASE_URL` cleaned the wrong database and reported "nada que
 * limpiar" while the test business stayed live in the public directory. Naming
 * it separately also means this can never delete from a database somebody did
 * not name on purpose.
 */
export default function globalTeardown() {
  const databaseUrl = process.env.PROD_DATABASE_URL;

  if (!databaseUrl) {
    console.warn(
      "\nEl negocio de prueba quedó en producción: falta PROD_DATABASE_URL.\n" +
        "  PROD_DATABASE_URL='...' npx tsx scripts/prod-smoke-cleanup.ts\n"
    );
    return;
  }

  try {
    const output = execFileSync("npx", ["tsx", "scripts/prod-smoke-cleanup.ts"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, DATABASE_URL: databaseUrl },
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
