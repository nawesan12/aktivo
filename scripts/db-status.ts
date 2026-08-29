// Must come first: importing `db` reads the validated environment.
import "dotenv/config";

import { db } from "@/lib/db";

/**
 * Quick look at what is actually in the database.
 *
 * `npx tsx scripts/db-status.ts`
 */
async function main() {
  const [businesses, users, services, staff, appointments, notifications] =
    await Promise.all([
      db.business.count(),
      db.user.count(),
      db.service.count(),
      db.staffMember.count(),
      db.appointment.count(),
      db.notification.count(),
    ]);

  console.table({ businesses, users, services, staff, appointments, notifications });

  const list = await db.business.findMany({
    select: { slug: true, name: true, isActive: true },
    orderBy: { name: "asc" },
  });
  console.table(list);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
