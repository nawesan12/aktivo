import { cn } from "@/lib/utils";

/**
 * Turnos por día, as seven bars.
 *
 * This used to be a Recharts `<BarChart>` behind `next/dynamic({ ssr: false })`
 * — about 180 KB of JavaScript, loaded on the panel's first screen, to draw
 * seven rectangles that never get hovered. Flexbox does it in the server render.
 *
 * The shade carries the same information as the height, which is what makes the
 * week readable at a glance instead of bar by bar.
 */
export function AppointmentsBarChart({
  days,
  className,
}: {
  days: { label: string; count: number; today: boolean }[];
  className?: string;
}) {
  const peak = Math.max(...days.map((d) => d.count), 1);

  return (
    <div className={cn("flex min-h-[120px] items-end gap-2.5", className)}>
      {days.map((day, index) => {
        const ratio = day.count / peak;
        return (
          <div key={index} className="flex h-full flex-1 flex-col justify-end gap-[5px]">
            <div
              className={cn(
                "rounded-t-md rounded-b-[2px]",
                day.today
                  ? "bg-primary"
                  : day.count === 0
                    ? "bg-muted"
                    : ratio < 0.4
                      ? "bg-[#d1fae5]"
                      : ratio < 0.7
                        ? "bg-[#a7f3d0]"
                        : "bg-[#6ee7b7]"
              )}
              // A bar for a day with no turnos still has to be visible, or the
              // week reads as if the shop was closed rather than empty.
              style={{ height: `${day.count === 0 ? 12 : Math.max(18, ratio * 100)}%` }}
            />
            <span
              className={cn(
                "text-center text-[9.5px]",
                day.today ? "font-bold text-jade-label" : "text-faint"
              )}
            >
              {day.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
