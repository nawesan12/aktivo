// Must come first: importing `db` reads the validated environment.
import "dotenv/config";

import { db } from "@/lib/db";
import { TEST_PHONE_PREFIX } from "../e2e/fixtures";

/**
 * Removes everything the end-to-end suite creates.
 *
 * Playwright cannot import the Prisma client (it is ESM, the runner loads it as
 * CommonJS), so cleanup runs as its own process — which also means the suite
 * itself only ever talks HTTP and can therefore run against a deployment.
 */
async function main() {
  const guests = await db.guestClient.findMany({
    where: { phone: { contains: TEST_PHONE_PREFIX } },
    select: { id: true },
  });

  if (guests.length === 0) {
    console.log("Nada que limpiar.");
    return;
  }

  const ids = guests.map((g) => g.id);

  const { count: appointments } = await db.appointment.deleteMany({
    where: { guestClientId: { in: ids } },
  });
  const { count: clients } = await db.guestClient.deleteMany({
    where: { id: { in: ids } },
  });

  console.log(`Limpiados ${appointments} turnos y ${clients} clientes de prueba.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
