// Must come first: importing `db` reads the validated environment.
import "dotenv/config";

import { db } from "@/lib/db";

/**
 * Removes the businesses the production smoke test creates.
 *
 * The smoke run registers a real account against the live database, and nothing
 * ever deleted it. Five runs in one day left five "Barberia Prueba …" in the
 * public directory — the entire contents of it — indexed in the sitemap and
 * visible to anyone who opened jikuapp.com/explorar.
 *
 * The email domain is the marker: `@jikuapp.test` is a reserved TLD that can
 * never belong to a real person, so this cannot delete a customer by accident.
 * Everything the run created hangs off the business and the user, and both
 * cascade.
 */
const SMOKE_EMAIL_DOMAIN = "@jikuapp.test";

async function main() {
  const users = await db.user.findMany({
    where: { email: { endsWith: SMOKE_EMAIL_DOMAIN } },
    select: { id: true, email: true, businesses: { select: { businessId: true } } },
  });

  if (users.length === 0) {
    console.log("Nada que limpiar.");
    return;
  }

  const businessIds = [...new Set(users.flatMap((u) => u.businesses.map((b) => b.businessId)))];

  // A business could in principle have another owner attached; only delete the
  // ones whose every member is a smoke account.
  const smokeUserIds = new Set(users.map((u) => u.id));
  const deletable: string[] = [];

  for (const businessId of businessIds) {
    const members = await db.userBusiness.findMany({
      where: { businessId },
      select: { userId: true },
    });
    if (members.every((member) => smokeUserIds.has(member.userId))) {
      deletable.push(businessId);
    }
  }

  const { count: businesses } = await db.business.deleteMany({
    where: { id: { in: deletable } },
  });
  const { count: accounts } = await db.user.deleteMany({
    where: { id: { in: [...smokeUserIds] } },
  });

  console.log(`Limpiados ${businesses} negocios y ${accounts} cuentas de prueba.`);
  for (const user of users) console.log(`  - ${user.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
