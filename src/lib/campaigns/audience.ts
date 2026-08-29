import { db } from "@/lib/db";
import type { Campaign } from "@/generated/prisma/client";

/**
 * Who a campaign is for.
 *
 * The manual "run now" button ignored the campaign type entirely and mailed
 * every client of the business — a birthday campaign wished a happy birthday to
 * everyone, on whatever day the owner happened to press the button. The type is
 * the campaign: this module is what makes BIRTHDAY, REBOOKING and INACTIVITY
 * mean something.
 */

export interface Recipient {
  id: string;
  type: "user" | "guest";
  name: string | null;
  email: string | null;
  phone: string | null;
}

/** Defaults for a campaign saved without its threshold. */
const DEFAULT_REBOOKING_DAYS = 30;
const DEFAULT_INACTIVITY_DAYS = 90;

export function triggerDays(campaign: Pick<Campaign, "type" | "triggerConfig">): number {
  const config = (campaign.triggerConfig ?? {}) as Record<string, unknown>;

  if (campaign.type === "REBOOKING") {
    const value = Number(config.rebookingDays);
    return Number.isFinite(value) && value > 0 ? value : DEFAULT_REBOOKING_DAYS;
  }

  const value = Number(config.inactivityDays);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_INACTIVITY_DAYS;
}

/**
 * How long before the same person can receive this campaign again.
 *
 * A birthday repeats yearly. Re-booking and inactivity nudges use their own
 * threshold as the cooldown — otherwise a daily cron would message the same
 * inactive client every single morning.
 */
export function cooldownDays(campaign: Pick<Campaign, "type" | "triggerConfig">): number {
  if (campaign.type === "BIRTHDAY") return 300;
  if (campaign.type === "CUSTOM") return Number.POSITIVE_INFINITY;
  return Math.max(triggerDays(campaign), 30);
}

function tagFilter(campaign: Campaign) {
  return campaign.targetTagIds.length > 0
    ? { some: { tagId: { in: campaign.targetTagIds } } }
    : undefined;
}

export async function resolveAudience(
  campaign: Campaign,
  now = new Date()
): Promise<Recipient[]> {
  switch (campaign.type) {
    case "BIRTHDAY":
      return birthdayAudience(campaign, now);
    case "REBOOKING":
      return rebookingAudience(campaign, now);
    case "INACTIVITY":
      return inactivityAudience(campaign, now);
    default:
      return everyClient(campaign);
  }
}

/** Every client of the business — the behaviour a CUSTOM blast expects. */
async function everyClient(campaign: Campaign): Promise<Recipient[]> {
  const tags = tagFilter(campaign);

  const [users, guests] = await Promise.all([
    db.user.findMany({
      where: {
        appointments: { some: { businessId: campaign.businessId } },
        ...(tags ? { tagAssignments: tags } : {}),
      },
      select: { id: true, name: true, email: true, phone: true },
    }),
    db.guestClient.findMany({
      where: {
        businessId: campaign.businessId,
        ...(tags ? { tagAssignments: tags } : {}),
      },
      select: { id: true, name: true, email: true, phone: true },
    }),
  ]);

  return [
    ...users.map((u) => ({ ...u, type: "user" as const })),
    ...guests.map((g) => ({ ...g, type: "guest" as const })),
  ];
}

/**
 * Birthdays are matched on month and day, ignoring the year — and in the
 * business's local calendar, not UTC, or half the greetings land a day early.
 */
async function birthdayAudience(campaign: Campaign, now: Date): Promise<Recipient[]> {
  const profiles = await db.clientProfile.findMany({
    where: { businessId: campaign.businessId, birthday: { not: null } },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      guestClient: { select: { id: true, name: true, email: true, phone: true } },
    },
  });

  const today = { month: now.getMonth(), day: now.getDate() };

  const matching = profiles.filter((profile) => {
    const birthday = profile.birthday!;
    return birthday.getMonth() === today.month && birthday.getDate() === today.day;
  });

  return matching
    .map((profile): Recipient | null => {
      if (profile.user) return { ...profile.user, type: "user" };
      if (profile.guestClient) return { ...profile.guestClient, type: "guest" };
      return null;
    })
    .filter((r): r is Recipient => r !== null);
}

/** Clients whose last visit is old enough to be worth a nudge. */
async function rebookingAudience(campaign: Campaign, now: Date): Promise<Recipient[]> {
  const threshold = new Date(now.getTime() - triggerDays(campaign) * 86_400_000);
  return lapsedClients(campaign, threshold, { requireVisit: true });
}

/** Clients with no activity at all in the window — not even a future booking. */
async function inactivityAudience(campaign: Campaign, now: Date): Promise<Recipient[]> {
  const threshold = new Date(now.getTime() - triggerDays(campaign) * 86_400_000);
  return lapsedClients(campaign, threshold, { requireVisit: false });
}

/**
 * Shared shape of both nudges: someone who has not been here since `threshold`
 * and has nothing booked ahead. The difference is whether a completed visit is
 * required (re-booking targets past customers; inactivity also covers people
 * who booked once and never came).
 */
async function lapsedClients(
  campaign: Campaign,
  threshold: Date,
  { requireVisit }: { requireVisit: boolean }
): Promise<Recipient[]> {
  const businessId = campaign.businessId;
  const tags = tagFilter(campaign);

  const recentOrUpcoming = {
    businessId,
    OR: [{ dateTime: { gte: threshold } }, { dateTime: { gte: new Date() } }],
    status: { notIn: ["CANCELLED" as const] },
  };

  const visited = requireVisit
    ? { some: { businessId, status: "COMPLETED" as const } }
    : { some: { businessId } };

  const [users, guests] = await Promise.all([
    db.user.findMany({
      where: {
        appointments: visited,
        NOT: { appointments: { some: recentOrUpcoming } },
        ...(tags ? { tagAssignments: tags } : {}),
      },
      select: { id: true, name: true, email: true, phone: true },
    }),
    db.guestClient.findMany({
      where: {
        businessId,
        appointments: visited,
        NOT: { appointments: { some: recentOrUpcoming } },
        ...(tags ? { tagAssignments: tags } : {}),
      },
      select: { id: true, name: true, email: true, phone: true },
    }),
  ]);

  return [
    ...users.map((u) => ({ ...u, type: "user" as const })),
    ...guests.map((g) => ({ ...g, type: "guest" as const })),
  ];
}
