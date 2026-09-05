// Must come first: importing `db` reads the validated environment.
import "dotenv/config";

import { db } from "@/lib/db";
import { normalisePhone } from "@/lib/phone";

/**
 * Rewrites stored phone numbers into their canonical form.
 *
 * Guest clients are keyed by `(businessId, phone)` on whatever string somebody
 * typed, so the same person could exist as "0223 632 7551" and as
 * "+54 9 223 632-7551" with their history split between the two. New rows are
 * written normalised, and `phoneLookupVariants` reaches the shapes without
 * separators — but not "223 632-7551", which is how the panel's own form used
 * to save them. Those rows are unreachable from the portal until this runs.
 *
 *   npx tsx scripts/backfill-phones.ts          # shows what it would change
 *   npx tsx scripts/backfill-phones.ts --apply  # writes
 */
async function main() {
  const apply = process.argv.includes("--apply");

  const guests = await db.guestClient.findMany({
    select: { id: true, businessId: true, name: true, phone: true },
  });

  const changes = guests
    .filter((guest): guest is typeof guest & { phone: string } => Boolean(guest.phone))
    .map((guest) => ({ ...guest, next: normalisePhone(guest.phone) }))
    .filter((guest) => guest.next !== guest.phone);

  if (changes.length === 0) {
    console.log("Nada para normalizar.");
    return;
  }

  console.log(`${changes.length} teléfono(s) para normalizar:`);
  for (const change of changes) {
    console.log(`  ${change.name}: ${change.phone} → ${change.next}`);
  }

  if (!apply) {
    console.log("\nNada se escribió. Volvé a correrlo con --apply.");
    return;
  }

  let updated = 0;
  let merged = 0;

  for (const change of changes) {
    // The normalised form may already exist for this business: the same person,
    // entered twice. Moving their appointments over and dropping the duplicate
    // is what the panel's own merge does, so this only handles the collision it
    // would otherwise hit.
    const twin = await db.guestClient.findFirst({
      where: { businessId: change.businessId, phone: change.next, id: { not: change.id } },
      select: { id: true },
    });

    if (twin) {
      await db.appointment.updateMany({
        where: { guestClientId: change.id },
        data: { guestClientId: twin.id },
      });
      console.log(`  ↳ ${change.name}: duplicado, turnos movidos (no se borra la fila vieja)`);
      merged += 1;
      continue;
    }

    await db.guestClient.update({ where: { id: change.id }, data: { phone: change.next } });
    updated += 1;
  }

  console.log(`\n${updated} normalizado(s), ${merged} con duplicado.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
