// Pure booking rules: no database access, no framework. Unit-tested in
// __tests__/availability-engine.test.ts — keep it free of I/O imports.
import {
  addMinutes,
  format,
  isBefore,
  isAfter,
  setHours,
  setMinutes,
  addHours,
} from "date-fns";
import { nowInArgentina, toArgentinaDate } from "./timezone";

export interface TimeSlot {
  time: Date;
  display: string;
  available: boolean;
}

/** Appointment statuses that occupy a slot on the calendar. */
export const OCCUPYING_STATUSES = ["PENDING_PAYMENT", "PENDING", "CONFIRMED"] as const;

/**
 * Minimal structural shapes of the data the slot engine needs.
 * Declared locally (instead of importing Prisma models) so the pure computation
 * can be unit-tested with plain objects, without a database.
 */
export interface WorkingHoursData {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface BlockedDateData {
  date: Date;
  type: string;
  startTime?: string | null;
  endTime?: string | null;
}

export interface RecurringBlockedData {
  dayOfWeek: number;
  time: string;
}

export interface DateOverrideData {
  date: Date;
  time: string;
  type: string;
}

export interface AppointmentData {
  dateTime: Date;
  endTime: Date;
}

/** Everything needed to compute slots for any day inside a date range. */
export interface AvailabilityData {
  workingHours: WorkingHoursData[];
  appointments: AppointmentData[];
  blockedDates: BlockedDateData[];
  recurringBlocked: RecurringBlockedData[];
  dateOverrides: DateOverrideData[];
}

export interface SlotOptions {
  serviceDuration: number;
  slotInterval?: number;
  minHoursAdvance?: number;
  bufferMinutes?: number;
  /** Injectable for tests; defaults to the current time in Argentina. */
  now?: Date;
}

/** Day key in Argentina time, used to bucket records by date. */
export function dayKey(date: Date): string {
  return format(toArgentinaDate(date), "yyyy-MM-dd");
}

/**
 * Computes the slots of a single day. Pure: no I/O, no clock access unless
 * `options.now` is omitted. This is the core booking rule of the product.
 */
export function computeSlotsForDay(
  data: AvailabilityData,
  date: Date,
  options: SlotOptions
): TimeSlot[] {
  const {
    serviceDuration,
    slotInterval = 30,
    minHoursAdvance = 2,
    bufferMinutes = 0,
  } = options;

  const tzDate = toArgentinaDate(date);
  const dayOfWeek = tzDate.getDay();
  const key = dayKey(date);

  // 1. Working hours for this weekday
  const workingHours = data.workingHours.find((wh) => wh.dayOfWeek === dayOfWeek);
  if (!workingHours || !workingHours.isActive) {
    return [];
  }

  // 2. Full-day block short-circuits everything
  const blockedDate = data.blockedDates.find((bd) => dayKey(bd.date) === key);
  if (blockedDate?.type === "FULL_DAY") {
    return [];
  }

  // 3. Working window
  const [startHour, startMin] = workingHours.startTime.split(":").map(Number);
  const [endHour, endMin] = workingHours.endTime.split(":").map(Number);
  const workStart = setMinutes(setHours(tzDate, startHour), startMin);
  const workEnd = setMinutes(setHours(tzDate, endHour), endMin);

  // 4. Index the per-slot rules of this day
  const recurringBlockedSet = new Set(
    data.recurringBlocked.filter((s) => s.dayOfWeek === dayOfWeek).map((s) => s.time)
  );
  const dateOverrideMap = new Map(
    data.dateOverrides.filter((o) => dayKey(o.date) === key).map((o) => [o.time, o.type])
  );
  const dayAppointments = data.appointments.filter((a) => dayKey(a.dateTime) === key);

  // 5. Walk the day
  const slots: TimeSlot[] = [];
  const now = options.now ?? nowInArgentina();
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
    const unavailable = () => {
      slots.push({ time: new Date(current), display: slotTimeStr, available: false });
      current = addMinutes(current, slotInterval);
    };

    // Minimum advance time
    if (isBefore(current, minBookingTime)) {
      unavailable();
      continue;
    }

    // Partial block on this date
    if (blockedDate?.type === "PARTIAL" && blockedDate.startTime && blockedDate.endTime) {
      const [bStartH, bStartM] = blockedDate.startTime.split(":").map(Number);
      const [bEndH, bEndM] = blockedDate.endTime.split(":").map(Number);
      const blockStart = setMinutes(setHours(tzDate, bStartH), bStartM);
      const blockEnd = setMinutes(setHours(tzDate, bEndH), bEndM);

      if (isBefore(current, blockEnd) && isAfter(slotEnd, blockStart)) {
        unavailable();
        continue;
      }
    }

    // Slot-level rules (DateSlotOverride wins over RecurringBlockedSlot)
    const dateOverride = dateOverrideMap.get(slotTimeStr);

    if (dateOverride === "BLOCKED") {
      unavailable();
      continue;
    }

    if (dateOverride !== "AVAILABLE" && recurringBlockedSet.has(slotTimeStr)) {
      unavailable();
      continue;
    }

    // Conflicting appointments — true interval overlap.
    // The slot occupies [current, slotEnd), where slotEnd already includes the buffer;
    // an existing appointment occupies [dateTime, endTime + buffer). Two intervals
    // overlap when each one starts before the other ends.
    const slotStartMs = current.getTime();
    const slotEndMs = slotEnd.getTime();
    const hasConflict = dayAppointments.some((appt) => {
      const apptEndMs = appt.endTime.getTime() + bufferMinutes * 60 * 1000;
      return slotStartMs < apptEndMs && slotEndMs > appt.dateTime.getTime();
    });

    slots.push({ time: new Date(current), display: slotTimeStr, available: !hasConflict });
    current = addMinutes(current, slotInterval);
  }

  return slots;
}


/** Format a time slot for display */
export function formatSlotTime(date: Date): string {
  return format(toArgentinaDate(date), "HH:mm");
}
