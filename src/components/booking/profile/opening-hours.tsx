import { cn } from "@/lib/utils";

export interface DayHours {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
/** Monday first: nobody reads their week starting on Sunday. */
const ORDER = [1, 2, 3, 4, 5, 6, 0];

/**
 * When the shop is open, with today picked out.
 *
 * There is no table of business hours in the schema — these are the union of
 * every professional's working hours, which is the only honest answer to "are
 * you open": the shop is open if anybody is working.
 */
export function OpeningHours({ hours, today }: { hours: DayHours[]; today: number }) {
  const byDay = new Map(hours.map((entry) => [entry.dayOfWeek, entry]));

  return (
    <section className="rounded-[14px] border border-border bg-card p-[18px]">
      <h2 className="mb-3 text-[13px] font-bold">Horarios</h2>
      <ul className="flex flex-col gap-[7px] text-xs">
        {ORDER.map((day) => {
          const entry = byDay.get(day);
          const isToday = day === today;
          return (
            <li
              key={day}
              className={cn(
                "flex justify-between px-2.5",
                isToday && "rounded-lg bg-primary/10 py-[5px] font-bold text-jade-label"
              )}
            >
              <span className={cn(!isToday && "text-muted-foreground")}>
                {DAY_NAMES[day]}
                {isToday && <span className="ml-1.5 text-[8.5px] tracking-[0.08em]">HOY</span>}
              </span>
              {entry ? (
                <span className={cn(!isToday && "font-semibold")}>
                  {entry.startTime} – {entry.endTime}
                </span>
              ) : (
                <span className="text-faint">Cerrado</span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** "20:00" when the shop is still open right now, null otherwise. */
export function openUntil(hours: DayHours[], now: Date): string | null {
  const entry = hours.find((h) => h.dayOfWeek === now.getDay());
  if (!entry) return null;
  const minutes = now.getHours() * 60 + now.getMinutes();
  const [openHour, openMinute] = entry.startTime.split(":").map(Number);
  const [closeHour, closeMinute] = entry.endTime.split(":").map(Number);
  const from = openHour * 60 + openMinute;
  const to = closeHour * 60 + closeMinute;
  return minutes >= from && minutes < to ? entry.endTime : null;
}
