import { db } from "@/lib/db";
import { SubscriptionRequiredError } from "@/lib/api-errors";

/** Days a new business gets with the full feature set before it has to pay. */
export const TRIAL_DAYS = 7;

export interface BusinessAccess {
  /** The panel is read-only: no trial left and no subscription paying for it. */
  blocked: boolean;
  /** Present while the trial is still running. */
  trialEndsAt: Date | null;
  trialDaysLeft: number;
  hasSubscription: boolean;
}

/**
 * Whether a business may still operate.
 *
 * Reading is always allowed — the owner has to be able to see their agenda, and
 * their customers keep booking on the public page either way. What stops is
 * writing, which is the part they are paying for.
 */
export async function getBusinessAccess(businessId: string): Promise<BusinessAccess> {
  const business = await db.business.findUniqueOrThrow({
    where: { id: businessId },
    select: { trialEndsAt: true, groupId: true },
  });

  // A branch does not pay separately: multi-location is what the top plan
  // sells, so any active subscription inside the group covers all of them.
  // Without this, every location created after the first would be born blocked.
  const subscription = await db.subscription.findFirst({
    where: {
      OR: [
        { status: "AUTHORIZED" },
        // A paused subscription still counts while the grace period runs: a
        // card that expired over the weekend should not close the shop. Once
        // the grace is over it stops counting, which is what actually blocks a
        // business that quietly stopped paying.
        {
          status: "PAUSED",
          OR: [{ gracePeriodEnd: null }, { gracePeriodEnd: { gt: new Date() } }],
        },
      ],
      ...(business.groupId
        ? { business: { groupId: business.groupId } }
        : { businessId }),
    },
    select: { id: true },
  });

  const now = Date.now();
  const trialEndsAt = business.trialEndsAt;
  const trialActive = trialEndsAt !== null && trialEndsAt.getTime() > now;

  const trialDaysLeft = trialActive
    ? Math.ceil((trialEndsAt.getTime() - now) / 86_400_000)
    : 0;

  return {
    blocked: !trialActive && !subscription,
    trialEndsAt: trialActive ? trialEndsAt : null,
    trialDaysLeft,
    hasSubscription: Boolean(subscription),
  };
}

/** Throws when the business may no longer write. */
export async function assertBusinessCanWrite(businessId: string): Promise<void> {
  const access = await getBusinessAccess(businessId);
  if (access.blocked) throw new SubscriptionRequiredError();
}

/** The moment a new business stops being free. */
export function trialEndsAtFromNow(): Date {
  return new Date(Date.now() + TRIAL_DAYS * 86_400_000);
}
