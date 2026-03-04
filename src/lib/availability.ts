import {
  addMinutes,
  format,
  isBefore,
  isAfter,
  startOfDay,
  endOfDay,
  setHours,
  setMinutes,
  addHours,
  addDays,
} from "date-fns";
import { db } from "./db";
import { nowInArgentina, toArgentinaDate } from "./timezone";

export interface TimeSlot {
  time: Date;
  display: string;
  available: boolean;
}

interface AvailabilityOptions {
  businessId: string;
  staffId: string;
  date: Date;
  serviceDuration: number;
  slotInterval?: number;
  minHoursAdvance?: number;
  bufferMinutes?: number;
}

/**
 * Get available time slots for a staff member on a given date.
 * Multi-tenant: all queries scoped by businessId via staffId.
 */
export async function getAvailableSlots({
  businessId,
  staffId,
  date,
  serviceDuration,
  slotInterval = 30,
  minHoursAdvance = 2,
  bufferMinutes = 0,
}: AvailabilityOptions): Promise<TimeSlot[]> {
  const tzDate = toArgentinaDate(date);
  const dayOfWeek = tzDate.getDay();

  // 1. Get working hours for this day
  const workingHours = await db.workingHours.findUnique({
    where: {
      staffId_dayOfWeek: {
        staffId,
        dayOfWeek,
      },
    },
  });

  if (!workingHours || !workingHours.isActive) {
    return [];
  }

  // 2. Check if date is fully blocked
  const blockedDate = await db.blockedDate.findFirst({
    where: {
      staffId,
      date: {
        gte: startOfDay(tzDate),
        lte: endOfDay(tzDate),
      },
    },
  });

  if (blockedDate?.type === "FULL_DAY") {
    return [];
  }

  // 3. Parse working hours
  const [startHour, startMin] = workingHours.startTime.split(":").map(Number);
  const [endHour, endMin] = workingHours.endTime.split(":").map(Number);

  const workStart = setMinutes(setHours(tzDate, startHour), startMin);
  const workEnd = setMinutes(setHours(tzDate, endHour), endMin);

  // 4. Batch fetch appointments, recurring blocks, and date overrides
  const [existingAppointments, recurringBlocked, dateOverrides] = await Promise.all([
    db.appointment.findMany({
      where: {
        businessId,
        staffId,
        dateTime: {
          gte: startOfDay(tzDate),
          lte: endOfDay(tzDate),
        },
        status: {
          in: ["PENDING_PAYMENT", "PENDING", "CONFIRMED"],
        },
      },
      orderBy: { dateTime: "asc" },
    }),
    db.recurringBlockedSlot.findMany({
      where: { staffId, dayOfWeek },
    }),
    db.dateSlotOverride.findMany({
      where: {
        staffId,
        date: {
          gte: startOfDay(tzDate),
          lte: endOfDay(tzDate),
        },
      },
    }),
  ]);

  const recurringBlockedSet = new Set(recurringBlocked.map((s) => s.time));
  const dateOverrideMap = new Map(dateOverrides.map((o) => [o.time, o.type]));

  // 5. Generate all possible slots
  const slots: TimeSlot[] = [];
  const now = nowInArgentina();
  const minBookingTime = addHours(now, minHoursAdvance);

  let current = workStart;
  const totalServiceTime = serviceDuration + bufferMinutes;

  while (isBefore(current, workEnd)) {
    const slotEnd = addMinutes(current, totalServiceTime);

    // Slot must not extend past closing time
    if (isAfter(slotEnd, workEnd)) {
      break;
    }

    const slotTimeStr = format(current, "HH:mm");

    // Check minimum advance time
    if (isBefore(current, minBookingTime)) {
      slots.push({ time: new Date(current), display: slotTimeStr, available: false });
      current = addMinutes(current, slotInterval);
      continue;
    }

    // Check for blocked partial date
    if (blockedDate?.type === "PARTIAL" && blockedDate.startTime && blockedDate.endTime) {
      const [bStartH, bStartM] = blockedDate.startTime.split(":").map(Number);
      const [bEndH, bEndM] = blockedDate.endTime.split(":").map(Number);
      const blockStart = setMinutes(setHours(tzDate, bStartH), bStartM);
      const blockEnd = setMinutes(setHours(tzDate, bEndH), bEndM);

      if (isBefore(current, blockEnd) && isAfter(slotEnd, blockStart)) {
        slots.push({ time: new Date(current), display: slotTimeStr, available: false });
        current = addMinutes(current, slotInterval);
        continue;
      }
    }

    // Check slot-level availability (DateSlotOverride > RecurringBlockedSlot)
    const dateOverride = dateOverrideMap.get(slotTimeStr);

    if (dateOverride === "BLOCKED") {
      slots.push({ time: new Date(current), display: slotTimeStr, available: false });
      current = addMinutes(current, slotInterval);
      continue;
    }

    if (dateOverride !== "AVAILABLE" && recurringBlockedSet.has(slotTimeStr)) {
      slots.push({ time: new Date(current), display: slotTimeStr, available: false });
      current = addMinutes(current, slotInterval);
      continue;
    }

    // Check for conflicting appointments (with buffer)
    const hasConflict = existingAppointments.some((appt) => {
      const slotTime = current.getTime();
      const apptEnd = appt.endTime.getTime() + bufferMinutes * 60 * 1000;
      return slotTime >= appt.dateTime.getTime() && slotTime < apptEnd;
    });

    slots.push({ time: new Date(current), display: slotTimeStr, available: !hasConflict });
    current = addMinutes(current, slotInterval);
  }

  return slots;
}

/**
 * Get available dates for the next N days — optimized with batch queries.
 * Multi-tenant scoped via staffId.
 */
export async function getAvailableDates(
  staffId: string,
  daysAhead: number = 30
): Promise<{ date: Date; hasSlots: boolean }[]> {
  const today = startOfDay(nowInArgentina());
  const endDate = addDays(today, daysAhead - 1);

  const allWorkingHours = await db.workingHours.findMany({
    where: { staffId, isActive: true },
  });
  const activeDays = new Set(allWorkingHours.map((wh) => wh.dayOfWeek));

  const blockedDates = await db.blockedDate.findMany({
    where: {
      staffId,
      type: "FULL_DAY",
      date: {
        gte: startOfDay(today),
        lte: endOfDay(endDate),
      },
    },
  });
  const blockedSet = new Set(
    blockedDates.map((bd) => format(bd.date, "yyyy-MM-dd"))
  );

  const dates: { date: Date; hasSlots: boolean }[] = [];

  for (let i = 0; i < daysAhead; i++) {
    const date = addDays(today, i);
    const tzDate = toArgentinaDate(date);
    const dayOfWeek = tzDate.getDay();
    const dateKey = format(tzDate, "yyyy-MM-dd");

    const hasSlots = activeDays.has(dayOfWeek) && !blockedSet.has(dateKey);
    dates.push({ date, hasSlots });
  }

  return dates;
}

/** Format a time slot for display */
export function formatSlotTime(date: Date): string {
  return format(toArgentinaDate(date), "HH:mm");
}
