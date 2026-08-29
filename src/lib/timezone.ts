import { TZDate } from "@date-fns/tz";

export const ARGENTINA_TZ = "America/Argentina/Buenos_Aires";

/** Returns a TZDate representing the current moment in Argentina time */
export function nowInArgentina(): TZDate {
  return new TZDate(new Date(), ARGENTINA_TZ);
}

/** Wraps any Date as a TZDate in Argentina timezone */
export function toArgentinaDate(date: Date): TZDate {
  return new TZDate(date, ARGENTINA_TZ);
}

/** Parses a "YYYY-MM-DD" string as midnight in Argentina timezone */
export function parseDateInArgentina(dateStr: string): TZDate {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new TZDate(year, month - 1, day, 0, 0, 0, 0, ARGENTINA_TZ);
}

/**
 * The calendar day an instant falls on *at the business*, as "YYYY-MM-DD".
 *
 * Not the same as slicing an ISO string: 2026-09-01T01:00Z is still 31 August
 * in Argentina, and a booking made late at night would otherwise be looked up
 * against the wrong day's schedule.
 */
export function formatArgentinaDate(date: Date): string {
  const tzDate = toArgentinaDate(date);
  const month = String(tzDate.getMonth() + 1).padStart(2, "0");
  const day = String(tzDate.getDate()).padStart(2, "0");
  return `${tzDate.getFullYear()}-${month}-${day}`;
}
