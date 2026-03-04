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
