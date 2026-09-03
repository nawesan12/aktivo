import { db } from "@/lib/db";
import { createLogger } from "@/lib/logger";

const log = createLogger("bookings:expiry");

/** Holds released in a single pass, so one call can never run unbounded. */
const DEFAULT_LIMIT = 200;

/**
 * Cancels bookings that were never paid, freeing the slot they were holding.
 *
 * This has to happen, and it has to happen before anyone tries to book over the
 * hold — because the database constraint that prevents double booking cannot
 * see time:
 *
 *   EXCLUDE USING gist ("staffId" WITH =, tsrange(...) WITH &&)
 *     WHERE (status IN ('PENDING_PAYMENT','PENDING','CONFIRMED'))
 *
 * The predicate of a partial index must be IMMUTABLE, and `now()` is not, so
 * `expiresAt` can never appear there. Meanwhile `getAvailableSlots` *does*
 * ignore expired holds. The two disagree, and the gap is nasty: the slot shows
 * as free, and every attempt to take it fails with 409 SLOT_TAKEN — for good,
 * because nothing is left to clean the row up. An unpaid guest booking would
 * kill that slot permanently.
 *
 * So the row gets cancelled at the only moment it matters: when someone is
 * about to write into the same slot. Idempotent, and cheap enough to call on
 * every booking attempt.
 */
export async function releaseExpiredHolds(
  scope: { businessId?: string; staffId?: string } = {},
  limit = DEFAULT_LIMIT
): Promise<{ released: number }> {
  const now = new Date();

  const expired = await db.appointment.findMany({
    where: {
      ...(scope.businessId ? { businessId: scope.businessId } : {}),
      ...(scope.staffId ? { staffId: scope.staffId } : {}),
      status: "PENDING_PAYMENT",
      expiresAt: { not: null, lte: now },
    },
    select: { id: true },
    take: limit,
  });

  if (expired.length === 0) return { released: 0 };

  const ids = expired.map((a) => a.id);

  await db.$transaction([
    db.appointment.updateMany({
      where: { id: { in: ids } },
      data: { status: "CANCELLED", expiresAt: null },
    }),
    // The pending payment goes with it, so it doesn't linger as a debt.
    db.payment.updateMany({
      where: { appointmentId: { in: ids }, status: "PENDING" },
      data: { status: "CANCELLED" },
    }),
  ]);

  log.info("released unpaid bookings", { count: ids.length, ...scope });

  return { released: ids.length };
}
