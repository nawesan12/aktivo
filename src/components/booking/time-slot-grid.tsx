"use client";

import { cn } from "@/lib/utils";

interface Slot {
  time: string;
  display: string;
  available: boolean;
}

interface TimeSlotGridProps {
  slots: Slot[];
  selectedTime: string | null;
  onSelect: (time: string, display: string) => void;
}

export function TimeSlotGrid({ slots, selectedTime, onSelect }: TimeSlotGridProps) {
  if (slots.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        No hay horarios disponibles para este dia.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
      {slots.map((slot) => (
        <button
          key={slot.time}
          type="button"
          disabled={!slot.available}
          onClick={() => slot.available && onSelect(slot.time, slot.display)}
          className={cn(
            "time-slot-pill py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-200 text-center",
            slot.available && slot.time !== selectedTime && "glass hover:bg-primary/10 hover:text-primary cursor-pointer",
            slot.available && slot.time === selectedTime && "brand-gradient text-white shadow-lg shadow-primary/20",
            !slot.available && "bg-secondary/50 text-muted-foreground/40 cursor-not-allowed line-through"
          )}
        >
          {slot.display}
        </button>
      ))}
    </div>
  );
}
