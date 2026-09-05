// Must come first: importing `db` reads the validated environment.
import "dotenv/config";

import { db } from "@/lib/db";
import { TEST_BUSINESS_PREFIX, TEST_PHONE_PREFIX } from "../e2e/fixtures";

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

  const ids = guests.map((g) => g.id);

  const { count: appointments } = ids.length
    ? await db.appointment.deleteMany({ where: { guestClientId: { in: ids } } })
    : { count: 0 };
  const { count: clients } = ids.length
    ? await db.guestClient.deleteMany({ where: { id: { in: ids } } })
    : { count: 0 };

  /*
    Y los negocios que la suite da de alta.

    Uno que quede sale publicado en el directorio y en el sitemap como
    cualquier otro. Cae en cascada: servicios, personal, horarios y turnos se
    van con él, y detrás el dueño que lo creó, que no sirve para nada más.
  */
  const businesses = await db.business.findMany({
    where: { slug: { startsWith: TEST_BUSINESS_PREFIX } },
    select: { id: true, members: { select: { userId: true } } },
  });

  let owners = 0;
  for (const business of businesses) {
    await db.business.delete({ where: { id: business.id } });
    for (const { userId } of business.members) {
      // Sólo si no le quedó ningún otro negocio: el dueño de dos locales, uno
      // de ellos de prueba, se queda.
      const otros = await db.userBusiness.count({ where: { userId } });
      if (otros === 0) {
        await db.user.delete({ where: { id: userId } }).then(() => { owners += 1; }).catch(() => {});
      }
    }
  }

  if (appointments + clients + businesses.length === 0) {
    console.log("Nada que limpiar.");
    return;
  }

  console.log(
    `Limpiados ${appointments} turnos, ${clients} clientes` +
      `${businesses.length ? `, ${businesses.length} negocios y ${owners} dueños` : ""} de prueba.`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
