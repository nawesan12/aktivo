import { cookies } from "next/headers";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { verifyClientToken } from "@/lib/client-auth";
import { createLogger } from "@/lib/logger";

const log = createLogger("client-identity");

export const CLIENT_TOKEN_COOKIE = "client-token";

/**
 * Who the visitor booking appointments is.
 *
 * A customer used to be two unrelated things. Booking while signed in wrote an
 * `Appointment.userId` and no `GuestClient` at all; booking signed out wrote a
 * `GuestClient` scoped to that one shop, keyed by phone. The two never met, so
 * the portal that looks people up by phone could not find anybody who had an
 * account — it answered "no appointments with this number" to someone who had
 * never been asked for a number in the first place.
 *
 * There is one identity now and its key is the email address: it is the same
 * string across every shop, it is what a signed-in user is identified by, and
 * it is the only channel this product has for reaching anybody.
 * `guestClientIds` collects every per-shop row that shares it.
 */
export interface ClientIdentity {
  userId: string | null;
  email: string | null;
  name: string | null;
  guestClientIds: string[];
  /** How the visitor got here, for the interface to adapt its copy. */
  via: "session" | "booking" | "link";
}

export function normaliseEmail(input: string): string {
  return input.trim().toLowerCase();
}

async function guestClientIdsFor(email: string): Promise<string[]> {
  const rows = await db.guestClient.findMany({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true },
  });
  return rows.map((row) => row.id);
}

/**
 * Resolves the visitor from a NextAuth session or a verified-code cookie.
 *
 * A signed-in visitor is still matched against guest rows carrying their
 * address: someone can book as a guest today and create an account tomorrow,
 * and those bookings are theirs either way.
 */
export async function resolveClientIdentity(): Promise<ClientIdentity | null> {
  const session = await auth();

  if (session?.user?.id) {
    const email = session.user.email ? normaliseEmail(session.user.email) : null;
    return {
      userId: session.user.id,
      email,
      name: session.user.name ?? null,
      guestClientIds: email ? await guestClientIdsFor(email) : [],
      via: "session",
    };
  }

  const store = await cookies();
  const token = store.get(CLIENT_TOKEN_COOKIE)?.value;
  if (!token) return null;

  const payload = await verifyClientToken(token);
  if (!payload) return null;

  const email = normaliseEmail(payload.email);

  /*
    An unverified session comes from having typed this address into a booking
    form, which proves nothing about being able to read it. It reaches what was
    booked as a guest and stops there: resolving the account would mean that
    booking a haircut under somebody else's address handed over their agenda.
    The emailed link is what upgrades this.
  */
  const [user, guestClientIds] = await Promise.all([
    payload.verified
      ? db.user.findUnique({ where: { email }, select: { id: true, name: true } })
      : null,
    guestClientIdsFor(email),
  ]);

  return {
    userId: user?.id ?? null,
    email,
    name: user?.name ?? payload.name ?? null,
    guestClientIds,
    via: payload.verified ? "link" : "booking",
  };
}

/**
 * Every appointment that belongs to this person, whichever half they were
 * written into. Returns a `where` that matches nothing when the identity is
 * empty, so a caller can never widen into somebody else's appointments by
 * forgetting to check.
 */
export function clientAppointmentWhere(
  identity: ClientIdentity
): Prisma.AppointmentWhereInput {
  const clauses: Prisma.AppointmentWhereInput[] = [];
  if (identity.userId) clauses.push({ userId: identity.userId });
  if (identity.guestClientIds.length > 0) {
    clauses.push({ guestClientId: { in: identity.guestClientIds } });
  }

  if (clauses.length === 0) return { id: { in: [] } };
  if (clauses.length === 1) return clauses[0];
  return { OR: clauses };
}

/** The guest row this person has at one shop, if any. */
export async function guestClientForBusiness(
  identity: ClientIdentity,
  businessId: string
): Promise<{ id: string } | null> {
  if (identity.guestClientIds.length === 0) return null;
  return db.guestClient.findFirst({
    where: { businessId, id: { in: identity.guestClientIds } },
    select: { id: true },
  });
}

/**
 * Hands over the appointments booked as a guest to the account that just
 * proved it owns the address.
 *
 * `guestClientId` is left in place: it is what the shop's own client list,
 * tags, notes and memberships hang off. Only `userId` is filled in, which is
 * what makes the booking show up in the account and reachable across shops.
 */
export async function claimGuestAppointments(
  userId: string,
  email: string
): Promise<number> {
  const guestClientIds = await guestClientIdsFor(normaliseEmail(email));
  if (guestClientIds.length === 0) return 0;

  const { count } = await db.appointment.updateMany({
    where: { guestClientId: { in: guestClientIds }, userId: null },
    data: { userId },
  });

  if (count > 0) log.info("claimed guest appointments", { userId, count });
  return count;
}
