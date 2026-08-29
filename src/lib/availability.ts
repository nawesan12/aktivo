import { startOfDay, endOfDay, addDays } from "date-fns";
import { db } from "./db";
import { nowInArgentina, toArgentinaDate } from "./timezone";
import {
  computeSlotsForDay,
  dayKey,
  OCCUPYING_STATUSES,
  type AvailabilityData,
  type SlotOptions,
  type TimeSlot,
} from "./availability-engine";

// Re-exported so existing imports of "@/lib/availability" keep working.
export * from "./availability-engine";

interface AvailabilityOptions extends SlotOptions {
  businessId: string;
  staffId: string;
  date: Date;
}

/**
 * Loads every availability rule for a staff member over a date range, in one batch.
 * Multi-tenant: appointments are scoped by businessId, the rest by staffId.
 */
async function fetchAvailabilityData(
  businessId: string,
  staffId: string,
  from: Date,
  to: Date
): Promise<AvailabilityData> {
  const now = new Date();

  const [workingHours, appointments, blockedDates, recurringBlocked, dateOverrides] =
    await Promise.all([
      db.workingHours.findMany({ where: { staffId } }),
      db.appointment.findMany({
        where: {
          businessId,
          staffId,
          dateTime: { gte: from, lte: to },
          status: { in: [...OCCUPYING_STATUSES] },
          // A booking awaiting payment only holds the slot until it expires.
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
        select: { dateTime: true, endTime: true },
        orderBy: { dateTime: "asc" },
      }),
      db.blockedDate.findMany({ where: { staffId, date: { gte: from, lte: to } } }),
      db.recurringBlockedSlot.findMany({ where: { staffId } }),
      db.dateSlotOverride.findMany({ where: { staffId, date: { gte: from, lte: to } } }),
    ]);

  return { workingHours, appointments, blockedDates, recurringBlocked, dateOverrides };
}

/**
 * Get available time slots for a staff member on a given date.
 * Multi-tenant: all queries scoped by businessId / staffId.
 */
export async function getAvailableSlots({
  businessId,
  staffId,
  date,
  ...options
}: AvailabilityOptions): Promise<TimeSlot[]> {
  const tzDate = toArgentinaDate(date);
  const data = await fetchAvailabilityData(
    businessId,
    staffId,
    startOfDay(tzDate),
    endOfDay(tzDate)
  );

  return computeSlotsForDay(data, date, options);
}

/**
 * Get availability for the next N days in a single batch of queries.
 *
 * When `serviceDuration` is provided, `hasSlots` reflects real occupancy — a day
 * whose slots are all taken is reported as unavailable. Without it, the answer is
 * limited to "does this staff member work that day and is it not blocked".
 */
export async function getAvailableDates({
  businessId,
  staffId,
  daysAhead = 30,
  ...options
}: {
  businessId: string;
  staffId: string;
  daysAhead?: number;
} & Partial<SlotOptions>): Promise<
  { date: Date; hasSlots: boolean; slotCount: number }[]
> {
  const today = startOfDay(nowInArgentina());
  const lastDay = addDays(today, daysAhead - 1);

  const data = await fetchAvailabilityData(
    businessId,
    staffId,
    today,
    endOfDay(lastDay)
  );

  const activeDays = new Set(
    data.workingHours.filter((wh) => wh.isActive).map((wh) => wh.dayOfWeek)
  );
  const fullyBlocked = new Set(
    data.blockedDates.filter((bd) => bd.type === "FULL_DAY").map((bd) => dayKey(bd.date))
  );

  const dates: { date: Date; hasSlots: boolean; slotCount: number }[] = [];

  for (let i = 0; i < daysAhead; i++) {
    const date = addDays(today, i);
    const tzDate = toArgentinaDate(date);

    // Cheap checks first — they also cover the case where no duration is known.
    if (!activeDays.has(tzDate.getDay()) || fullyBlocked.has(dayKey(date))) {
      dates.push({ date, hasSlots: false, slotCount: 0 });
      continue;
    }

    if (!options.serviceDuration) {
      dates.push({ date, hasSlots: true, slotCount: 0 });
      continue;
    }

    // Full slot computation, in memory — no extra queries.
    const slots = computeSlotsForDay(data, date, options as SlotOptions);
    const slotCount = slots.filter((s) => s.available).length;
    dates.push({ date, hasSlots: slotCount > 0, slotCount });
  }

  return dates;
}

