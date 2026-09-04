"use client";

import { format, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { Sparkles } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface Slot {
  time: string;
  display: string;
  available: boolean;
}

/**
 * Six days as a strip, not a month as a calendar.
 *
 * A month grid asks the customer to find a day; the strip answers the question
 * they actually have, which is "when is the soonest". Days with nothing free are
 * greyed rather than removed, so the week keeps its shape.
 */
export function DateStrip({
  days,
  selected,
  onSelect,
  loading,
}: {
  days: { date: Date; hasSlots: boolean }[];
  selected: Date | null;
  onSelect: (date: Date) => void;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="mb-3.5 flex gap-1.5 lg:gap-[7px]">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[54px] w-[50px] shrink-0 rounded-[11px] lg:w-auto lg:flex-1" />
        ))}
      </div>
    );
  }

  return (
    <div className="mb-3.5 flex gap-1.5 overflow-x-auto pb-1 lg:gap-[7px] lg:overflow-visible lg:pb-0">
      {days.map(({ date, hasSlots }) => {
        const active = selected !== null && isSameDay(date, selected);
        return (
          <button
            key={date.toISOString()}
            type="button"
            disabled={!hasSlots}
            onClick={() => onSelect(date)}
            aria-pressed={active}
            className={cn(
              "w-[50px] shrink-0 rounded-[11px] py-2.5 text-center transition-colors lg:w-auto lg:flex-1 lg:rounded-[10px] lg:py-[11px]",
              !hasSlots
                ? "cursor-not-allowed border border-border-subtle bg-muted text-disabled"
                : active
                  ? "border-2 border-primary bg-card"
                  : "border border-border bg-card hover:border-faint"
            )}
          >
            <span
              className={cn(
                "block text-[8.5px] uppercase lg:text-[9.5px]",
                active ? "font-bold text-jade-label" : "text-muted-foreground"
              )}
            >
              {format(date, "EEE", { locale: es })}
            </span>
            <span className={cn("mt-0.5 block text-sm lg:text-[15px]", active ? "font-extrabold" : "font-bold")}>
              {format(date, "d")}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Morning is anything before 13:00 in the business's own clock. */
function partOfDay(display: string) {
  return Number(display.slice(0, 2)) < 13 ? "Mañana" : "Tarde";
}

/**
 * The day's free times, split into morning and afternoon.
 *
 * They used to be one flat grid of every slot in the day in a single run, which
 * on a shop open ten hours is thirty pills with nothing to hold on to. Taken
 * slots stay visible, struck through — seeing that 10:30 is gone is what makes
 * 09:45 read as a real choice.
 */
export function SlotGroups({
  slots,
  selected,
  onSelect,
  loading,
  suggestion,
  empty,
  idle,
}: {
  slots: Slot[];
  selected: string | null;
  onSelect: (slot: Slot) => void;
  loading?: boolean;
  suggestion?: string | null;
  empty?: React.ReactNode;
  /** No day chosen yet — not the same thing as a day with nothing free. */
  idle?: boolean;
}) {
  if (idle) {
    return (
      <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-[12.5px] text-muted-foreground">
        Elegí un día y te muestro los horarios libres.
      </p>
    );
  }

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-[7px] lg:grid-cols-5 lg:gap-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-[42px] rounded-[10px]"
            style={{ animationDelay: `${i * 0.06}s` }}
          />
        ))}
      </div>
    );
  }

  if (slots.length === 0) return <>{empty}</>;

  const groups = [
    { label: "Mañana", items: slots.filter((s) => partOfDay(s.display) === "Mañana") },
    { label: "Tarde", items: slots.filter((s) => partOfDay(s.display) === "Tarde") },
  ].filter((group) => group.items.length > 0);

  return (
    <div>
      {suggestion && (
        <p className="mb-3.5 flex items-center gap-2 rounded-[10px] border border-jade-link/30 bg-card px-3 py-2 text-[10.5px] font-semibold text-jade-label">
          <Sparkles className="size-3.5 shrink-0" aria-hidden />
          {suggestion}
        </p>
      )}

      {groups.map((group) => (
        <div key={group.label} className="mb-3">
          {groups.length > 1 && (
            <p className="mb-[7px] text-[9.5px] font-bold uppercase tracking-[0.1em] text-faint">
              {group.label}
            </p>
          )}
          <div className="grid grid-cols-3 gap-[7px] lg:grid-cols-5 lg:gap-2">
            {group.items.map((slot) => {
              // `selected` is the store's "HH:mm", which is what the summary and
              // the POST body use. `slot.time` is the full ISO instant, so
              // comparing against it never matched and the chosen slot never
              // lit up.
              const active = slot.display === selected;
              return (
                <button
                  key={slot.time}
                  type="button"
                  disabled={!slot.available}
                  onClick={() => onSelect(slot)}
                  aria-pressed={active}
                  className={cn(
                    "rounded-[10px] py-3 text-center text-[13px] transition-colors lg:py-[11px]",
                    !slot.available
                      ? "cursor-not-allowed border border-border-subtle bg-muted text-disabled line-through"
                      : active
                        ? "bg-primary font-extrabold text-primary-foreground shadow-[0_6px_16px_-6px_rgba(74,222,128,0.6)]"
                        : "border border-border bg-card font-semibold hover:border-primary hover:text-jade-label"
                  )}
                >
                  {slot.display}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
