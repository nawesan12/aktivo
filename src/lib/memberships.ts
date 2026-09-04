import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

/**
 * Memberships: a shop selling "cuatro cortes al mes" instead of charging per
 * visit.
 *
 * The balance of a membership is the sum of its credits, never a column. A
 * counter and a ledger are two records of the same fact and they drift — the
 * first booking that decrements one without writing the other leaves a member
 * with visits nobody can account for and no way to tell which number is right.
 */

export interface MembershipBalance {
  membershipId: string;
  planName: string;
  endDate: Date;
  /** Visits left. Negative is impossible; the spend path refuses to go under. */
  remaining: number;
  /** Days of booking window this member gets ahead of everyone else. */
  priorityDays: number;
}

/** Who a membership belongs to. One of the two is always set. */
export type MemberRef = { userId: string } | { guestClientId: string };

function memberWhere(member: MemberRef): Prisma.MembershipWhereInput {
  return "userId" in member
    ? { userId: member.userId }
    : { guestClientId: member.guestClientId };
}

/**
 * The client's usable membership at this business, or null.
 *
 * Expiry is evaluated against the clock rather than trusted from `status`: a
 * membership whose period ended yesterday is not active, whether or not any job
 * has run to say so.
 */
export async function getActiveMembership(
  businessId: string,
  member: MemberRef
): Promise<MembershipBalance | null> {
  const membership = await db.membership.findFirst({
    where: {
      businessId,
      status: "ACTIVE",
      endDate: { gt: new Date() },
      ...memberWhere(member),
    },
    orderBy: { endDate: "desc" },
    include: { plan: { select: { name: true, priorityDays: true } } },
  });

  if (!membership) return null;

  const remaining = await membershipBalance(membership.id);

  return {
    membershipId: membership.id,
    planName: membership.plan.name,
    endDate: membership.endDate,
    remaining,
    priorityDays: membership.plan.priorityDays,
  };
}

/** Visits left on one membership. */
export async function membershipBalance(membershipId: string): Promise<number> {
  const total = await db.membershipCredit.aggregate({
    where: { membershipId },
    _sum: { amount: true },
  });
  return total._sum.amount ?? 0;
}

/**
 * Spends one visit, inside the caller's transaction.
 *
 * The balance is re-read here rather than taken from the caller: two bookings
 * arriving together would both have seen the same "1 left" and both would
 * spend it. Reading inside the transaction — which the booking already opens to
 * write the appointment — is what makes the last visit go to exactly one of
 * them.
 *
 * Returns false when there was nothing left, so the caller can fall back to
 * charging normally instead of failing the booking.
 */
export async function spendVisit(
  tx: Prisma.TransactionClient,
  args: { businessId: string; membershipId: string; appointmentId: string }
): Promise<boolean> {
  const total = await tx.membershipCredit.aggregate({
    where: { membershipId: args.membershipId },
    _sum: { amount: true },
  });

  if ((total._sum.amount ?? 0) < 1) return false;

  await tx.membershipCredit.create({
    data: {
      businessId: args.businessId,
      membershipId: args.membershipId,
      amount: -1,
      reason: "Turno reservado",
      appointmentId: args.appointmentId,
    },
  });

  return true;
}

/**
 * Gives a visit back when a covered appointment is cancelled.
 *
 * Without this the member pays for the cancellation twice: they lose the slot
 * and the visit. Idempotent by construction — it only refunds an appointment
 * that actually spent something and has not been refunded already.
 */
export async function refundVisit(appointmentId: string): Promise<void> {
  const spent = await db.membershipCredit.findFirst({
    where: { appointmentId, amount: { lt: 0 } },
  });

  if (!spent) return;

  const alreadyRefunded = await db.membershipCredit.findFirst({
    where: { appointmentId, amount: { gt: 0 } },
  });

  if (alreadyRefunded) return;

  await db.membershipCredit.create({
    data: {
      businessId: spent.businessId,
      membershipId: spent.membershipId,
      amount: 1,
      reason: "Turno cancelado",
      appointmentId,
    },
  });
}

/** The date a plan's period ends, counted from now. */
export function periodEnd(durationDays: number, from = new Date()): Date {
  return new Date(from.getTime() + durationDays * 86_400_000);
}
