"use client";

import { format, isToday, isTomorrow } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { Clock } from "lucide-react";

import { statusStyle } from "@/lib/appointment-status";
import { cn } from "@/lib/utils";

interface UpcomingAppointment {
  id: string;
  clientName: string;
  serviceName: string;
  staffName: string;
  dateTime: string;
  status: string;
}

/**
 * The next few turnos, as the design draws them: the hour first, a coloured
 * spine carrying the status, then who and what.
 *
 * The status used to be a pill at the end of every row, which put six words of
 * chrome next to three words of content on a 340px column. The 3px bar says the
 * same thing without competing with the name.
 */
export function UpcomingList({
  appointments,
  limit = 3,
}: {
  appointments: UpcomingAppointment[];
  limit?: number;
}) {
  if (appointments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
        <Clock className="size-7 opacity-40" aria-hidden />
        <p className="text-[12.5px]">No hay turnos próximos</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[7px]">
      {appointments.slice(0, limit).map((apt) => {
        const when = new Date(apt.dateTime);
        return (
          // The rows already lit up on hover and did nothing when clicked. They
          // lead to the turno now, filtered by the client's name.
          <Link
            key={apt.id}
            href={`/panel/turnos?search=${encodeURIComponent(apt.clientName)}`}
            className="flex items-center gap-[11px] rounded-[9px] border border-border-subtle bg-background px-3 py-[9px] transition-colors hover:border-faint"
          >
            <span className="min-w-[38px] shrink-0 text-[11.5px] font-bold tabular-nums">
              {format(when, "HH:mm")}
            </span>
            <span
              className={cn("h-[26px] w-[3px] shrink-0 rounded", statusStyle(apt.status).dot)}
              aria-hidden
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-semibold">{apt.clientName}</span>
              <span className="block truncate text-[10px] text-muted-foreground">
                {/* The day only matters once the list runs past today. */}
                {!isToday(when) && (
                  <>{isTomorrow(when) ? "Mañana" : format(when, "EEE d", { locale: es })} · </>
                )}
                {apt.serviceName} · {apt.staffName}
              </span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}
