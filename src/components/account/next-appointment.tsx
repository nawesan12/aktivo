"use client";

import { differenceInMinutes, format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarPlus } from "lucide-react";

import { downloadICS } from "@/lib/ics-generator";
import { formatCurrency } from "@/lib/format";

export interface NextAppointment {
  id: string;
  dateTime: string;
  service: { name: string; duration: number; price: number };
  staff: { name: string };
  business: { name: string; slug: string };
  paid?: number;
}

function countdown(target: Date, now: Date) {
  const minutes = differenceInMinutes(target, now);
  if (minutes < 60) return `en ${Math.max(minutes, 1)} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `en ${hours} h`;
  const days = Math.floor(hours / 24);
  const rest = hours % 24;
  return rest > 0 ? `en ${days} d ${rest} h` : `en ${days} d`;
}

/**
 * The next turno, as the whole point of the screen.
 *
 * "Mis turnos" used to be a filter bar over a paginated table, with the next
 * appointment as one row among twenty — the same weight as something from
 * eighteen months ago. This is the only thing on the page anybody opens it for.
 */
export function NextAppointmentCard({
  appointment,
  onReschedule,
  onCancel,
}: {
  appointment: NextAppointment;
  onReschedule?: () => void;
  onCancel?: () => void;
}) {
  const when = new Date(appointment.dateTime);
  const now = new Date();
  const remaining = Math.max(appointment.service.price - (appointment.paid ?? 0), 0);

  return (
    <article className="mb-5 flex flex-col gap-5 rounded-2xl border-2 border-primary bg-card p-6 shadow-[0_16px_40px_-18px_rgba(74,222,128,0.45)] lg:flex-row lg:items-center lg:gap-[22px]">
      <div className="min-w-[76px] rounded-[14px] bg-primary/[0.12] px-5 py-3.5 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-jade-label">
          {format(when, "EEE", { locale: es })}
        </p>
        <p className="text-[32px] font-extrabold leading-[1.05] text-jade-label">
          {format(when, "d")}
        </p>
        <p className="text-[10.5px] text-muted-foreground">{format(when, "MMMM", { locale: es })}</p>
      </div>

      <div className="flex-1">
        <div className="mb-1.5 flex flex-wrap items-center gap-2.5">
          <span className="rounded-full bg-jade-fill px-2.5 py-[3px] text-[9.5px] font-bold tracking-[0.05em] text-jade-label">
            PRÓXIMO TURNO
          </span>
          <span className="text-[11px] text-faint">{countdown(when, now)}</span>
        </div>
        <h2 className="text-lg font-bold tracking-[-0.02em]">
          {appointment.service.name} · {format(when, "HH:mm")}
        </h2>
        <p className="mt-[3px] text-[12.5px] text-muted-foreground">
          {appointment.business.name} · con {appointment.staff.name}
        </p>
        {(appointment.paid ?? 0) > 0 && (
          <p className="mt-1.5 text-[11.5px] text-jade-label">
            Seña pagada {formatCurrency(appointment.paid!)}
            {remaining > 0 && ` · restan ${formatCurrency(remaining)} en el local`}
          </p>
        )}
      </div>

      <div className="flex shrink-0 flex-col gap-2">
        <button
          type="button"
          onClick={() =>
            downloadICS({
              title: `${appointment.service.name} — ${appointment.business.name}`,
              description: `Con ${appointment.staff.name}`,
              location: appointment.business.name,
              start: when,
              end: new Date(when.getTime() + appointment.service.duration * 60_000),
            })
          }
          className="flex items-center justify-center gap-1.5 rounded-[9px] bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground transition-colors hover:bg-[#22c55e]"
        >
          <CalendarPlus className="size-3.5" aria-hidden />
          Agregar al calendario
        </button>
        {/*
          These used to be one link to the shop's guest portal — which asked a
          signed-in customer for a phone number in order to reach the very
          appointment they were already looking at, and then told them it could
          not find it. The screen that shows the booking is the screen that
          changes it.
        */}
        {onReschedule && (
          <button
            type="button"
            onClick={onReschedule}
            className="rounded-[9px] border border-border px-5 py-2.5 text-center text-xs text-muted-foreground transition-colors hover:border-faint"
          >
            Reprogramar
          </button>
        )}
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-[9px] px-5 py-2.5 text-center text-xs text-muted-foreground transition-colors hover:text-danger-foreground"
          >
            Cancelar turno
          </button>
        )}
      </div>
    </article>
  );
}
