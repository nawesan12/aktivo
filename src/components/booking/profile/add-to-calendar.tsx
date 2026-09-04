"use client";

import { CalendarPlus } from "lucide-react";

import { downloadICS } from "@/lib/ics-generator";
import type { Confirmation } from "@/lib/booking/confirmation";

export function AddToCalendar({ appointment }: { appointment: Confirmation }) {
  return (
    <button
      type="button"
      onClick={() =>
        downloadICS({
          title: `${appointment.serviceName} — ${appointment.business.name}`,
          description: `Con ${appointment.staffName}`,
          location: appointment.business.address || appointment.business.name,
          start: new Date(appointment.dateTime),
          end: new Date(appointment.endTime),
        })
      }
      className="flex items-center justify-center gap-2 rounded-[11px] bg-primary py-3.5 text-[13.5px] font-bold text-primary-foreground transition-colors hover:bg-[#22c55e]"
    >
      <CalendarPlus className="size-4" aria-hidden />
      Agregar al calendario
    </button>
  );
}
