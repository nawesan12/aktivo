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
 * The times at least one member of staff can take, for a given service.
 *
 * "Cualquier profesional" used to mean "the first one alphabetically", which
 * turned a busy barber into an empty agenda: the customer was told there were
 * no times while somebody else was free all afternoon. A slot is offered here
 * if anybody who performs the service is free at it.
 */
export async function getAnyStaffSlots({
  businessId,
  serviceId,
  date,
  ...options
}: Omit<AvailabilityOptions, "staffId"> & { serviceId: string }): Promise<TimeSlot[]> {
  const staff = await db.staffMember.findMany({
    where: {
      businessId,
      isActive: true,
      services: { some: { serviceId } },
    },
    select: { id: true },
    orderBy: { sortOrder: "asc" },
  });

  if (staff.length === 0) return [];

  const perStaff = await Promise.all(
    staff.map((member) =>
      getAvailableSlots({ businessId, staffId: member.id, date, ...options })
    )
  );

  // Union by instant: available for anyone means available.
  const merged = new Map<number, TimeSlot>();

  for (const slots of perStaff) {
    for (const slot of slots) {
      const key = slot.time.getTime();
      const existing = merged.get(key);

      if (!existing || (!existing.available && slot.available)) {
        merged.set(key, slot);
      }
    }
  }

  return [...merged.values()].sort((a, b) => a.time.getTime() - b.time.getTime());
}

/**
 * Somebody who performs this service and is actually free at this instant.
 *
 * Used when the customer picked "cualquier profesional": the union of everyone's
 * slots says the time is takeable, and this says by whom. Returns null when the
 * time filled up between reading availability and booking it — the caller turns
 * that into the same 409 as any other lost race.
 */
export async function findFreeStaff({
  businessId,
  serviceId,
  instant,
  options,
}: {
  businessId: string;
  serviceId: string;
  instant: Date;
  options: Omit<AvailabilityOptions, "staffId">;
}): Promise<{
  id: string;
  name: string;
  userId: string | null;
  googleCalendarEnabled: boolean;
} | null> {
  const candidates = await db.staffMember.findMany({
    where: {
      businessId,
      isActive: true,
      services: { some: { serviceId } },
    },
    select: { id: true, name: true, userId: true, googleCalendarEnabled: true },
    orderBy: { sortOrder: "asc" },
  });

  for (const candidate of candidates) {
    const slots = await getAvailableSlots({ ...options, staffId: candidate.id });
    const slot = slots.find((s) => s.time.getTime() === instant.getTime());

    if (slot?.available) return candidate;
  }

  return null;
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

/**
 * Which days have room for a service, counting everybody who performs it.
 *
 * The counterpart of `getAnyStaffSlots` for the calendar. Without it, a
 * customer who chose "cualquier profesional" saw the availability of one
 * person: a month of grey days because the first barber is booked solid, while
 * the rest of the team had space.
 */
export async function getAnyStaffDates({
  businessId,
  serviceId,
  daysAhead = 30,
  ...options
}: {
  businessId: string;
  serviceId: string;
  daysAhead?: number;
} & Partial<SlotOptions>): Promise<
  { date: Date; hasSlots: boolean; slotCount: number }[]
> {
  const staff = await db.staffMember.findMany({
    where: { businessId, isActive: true, services: { some: { serviceId } } },
    select: { id: true },
    orderBy: { sortOrder: "asc" },
  });

  if (staff.length === 0) return [];

  const perStaff = await Promise.all(
    staff.map((member) =>
      getAvailableDates({ businessId, staffId: member.id, daysAhead, ...options })
    )
  );

  // Merge by day: open if anybody is open, and the counts add up because they
  // are different people's slots.
  const merged = new Map<number, { date: Date; hasSlots: boolean; slotCount: number }>();

  for (const days of perStaff) {
    for (const day of days) {
      const key = day.date.getTime();
      const existing = merged.get(key);

      if (!existing) {
        merged.set(key, { ...day });
        continue;
      }

      existing.hasSlots = existing.hasSlots || day.hasSlots;
      existing.slotCount += day.slotCount;
    }
  }

  return [...merged.values()].sort((a, b) => a.date.getTime() - b.date.getTime());
}
