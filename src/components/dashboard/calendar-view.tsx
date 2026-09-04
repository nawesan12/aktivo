"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import {
  addDays,
  addMonths,
  addWeeks,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { AppointmentDetailDialog } from "./appointment-detail-dialog";
import { CalendarSkeleton } from "@/components/skeletons/dashboard-skeleton";
import { cn } from "@/lib/utils";

type ViewMode = "month" | "week" | "day";

interface CalendarAppointment {
  id: string;
  clientName: string;
  clientEmail?: string | null;
  clientPhone?: string | null;
  clientType: string;
  serviceName: string;
  serviceDuration: number;
  servicePrice: number;
  staffId: string;
  staffName: string;
  dateTime: string;
  endTime?: string;
  status: string;
  notes?: string | null;
  paymentStatus?: string | null;
  paymentAmount?: number | null;
}

/**
 * The colour of a chip carries the one thing the owner scans for.
 *
 * Status wins over the professional: a turno still waiting on a payment, or one
 * that already arrived with its deposit, is what changes what you do next. When
 * nothing is pending, the colour goes back to saying who is taking it — which is
 * how you read a week at a glance with two people on the floor.
 */
const STAFF_TONES = [
  { chip: "bg-[#ecfdf5] border-l-primary", legend: "bg-primary" },
  { chip: "bg-staff-2-fill border-l-staff-2", legend: "bg-staff-2" },
  { chip: "bg-[#eff6ff] border-l-info", legend: "bg-info" },
];

function toneFor(appointment: CalendarAppointment, staffOrder: string[]) {
  if (appointment.status === "PENDING" || appointment.status === "PENDING_PAYMENT") {
    return "bg-[#fefce8] border-l-warning";
  }
  if (appointment.paymentStatus === "APPROVED") return "bg-[#eff6ff] border-l-info";
  const index = Math.max(staffOrder.indexOf(appointment.staffId), 0);
  return STAFF_TONES[index % STAFF_TONES.length].chip;
}

function suffixFor(appointment: CalendarAppointment) {
  if (appointment.status === "PENDING" || appointment.status === "PENDING_PAYMENT") return " · espera";
  if (appointment.paymentStatus === "APPROVED") return " · $ señado";
  return "";
}

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [selectedApt, setSelectedApt] = useState<CalendarAppointment | null>(null);

  const dateRange = useMemo(() => {
    if (viewMode === "month") {
      return {
        from: startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 }),
        to: endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 }),
      };
    }
    if (viewMode === "week") {
      return {
        from: startOfWeek(currentDate, { weekStartsOn: 1 }),
        to: endOfWeek(currentDate, { weekStartsOn: 1 }),
      };
    }
    return { from: startOfDay(currentDate), to: endOfDay(currentDate) };
  }, [currentDate, viewMode]);

  const params = new URLSearchParams({
    page: "1",
    pageSize: "500",
    dateFrom: dateRange.from.toISOString(),
    dateTo: dateRange.to.toISOString(),
  });

  const { data, isLoading, mutate } = useSWR(`/api/panel/appointments?${params}`);
  // Memoised so the `??` fallback does not hand the hooks below a brand new
  // empty array on every render.
  const appointments: CalendarAppointment[] = useMemo(() => data?.data ?? [], [data]);

  // Stable ordering so a professional keeps the same colour as you page through
  // the weeks, instead of swapping whenever the first booking changes hands.
  const staffOrder = useMemo(() => {
    const seen = new Map<string, string>();
    for (const appointment of [...appointments].sort((a, b) => a.staffName.localeCompare(b.staffName))) {
      if (!seen.has(appointment.staffId)) seen.set(appointment.staffId, appointment.staffName);
    }
    return [...seen.entries()];
  }, [appointments]);
  const staffIds = staffOrder.map(([id]) => id);

  function navigate(direction: "prev" | "next" | "today") {
    if (direction === "today") return setCurrentDate(new Date());
    if (viewMode === "month") {
      return setCurrentDate((d) => (direction === "prev" ? subMonths(d, 1) : addMonths(d, 1)));
    }
    if (viewMode === "week") {
      return setCurrentDate((d) => (direction === "prev" ? subWeeks(d, 1) : addWeeks(d, 1)));
    }
    setCurrentDate((d) => addDays(d, direction === "prev" ? -1 : 1));
  }

  async function handleStatusChange(id: string, newStatus: string) {
    try {
      const res = await fetch(`/api/panel/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success("Estado actualizado");
      mutate();
      setSelectedApt(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error");
    }
  }

  const title =
    viewMode === "day"
      ? format(currentDate, "EEEE d 'de' MMMM", { locale: es })
      : format(currentDate, "MMMM yyyy", { locale: es });

  if (isLoading) return <CalendarSkeleton />;

  return (
    <>
      <div className="mb-[18px] flex flex-wrap items-center gap-3.5">
        <h2 className="text-[19px] font-bold capitalize tracking-[-0.025em]">{title}</h2>

        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => navigate("prev")}
            aria-label="Anterior"
            className="flex size-[30px] items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:border-faint"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => navigate("today")}
            className="flex h-[30px] items-center rounded-lg border border-primary bg-card px-3 text-xs font-semibold text-jade-label"
          >
            Hoy
          </button>
          <button
            type="button"
            onClick={() => navigate("next")}
            aria-label="Siguiente"
            className="flex size-[30px] items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:border-faint"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        <div className="ml-auto flex gap-[3px] rounded-[9px] border border-border bg-card p-[3px] text-[11.5px]">
          {(["month", "week", "day"] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              aria-pressed={viewMode === mode}
              className={cn(
                "rounded-[7px] px-3.5 py-1.5 transition-colors",
                viewMode === mode
                  ? "bg-jade-fill font-semibold text-jade-label"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {mode === "month" ? "Mes" : mode === "week" ? "Semana" : "Día"}
            </button>
          ))}
        </div>

        {staffOrder.length > 1 && (
          <div className="flex w-full flex-wrap items-center gap-2.5 text-[11px] text-muted-foreground lg:w-auto">
            {staffOrder.slice(0, 3).map(([id, name], index) => (
              <span key={id} className="flex items-center gap-1.5">
                <span className={cn("size-2 rounded-full", STAFF_TONES[index % 3].legend)} />
                {name.split(" ")[0]}
              </span>
            ))}
          </div>
        )}
      </div>

      {viewMode === "month" && (
        <MonthView
          currentDate={currentDate}
          appointments={appointments}
          staffIds={staffIds}
          onSelectAppointment={setSelectedApt}
          onSelectDate={(date) => {
            setCurrentDate(date);
            setViewMode("day");
          }}
        />
      )}

      {viewMode === "week" && (
        <WeekView
          currentDate={currentDate}
          appointments={appointments}
          staffIds={staffIds}
          onSelectAppointment={setSelectedApt}
        />
      )}

      {viewMode === "day" && (
        <DayView
          currentDate={currentDate}
          appointments={appointments}
          staffIds={staffIds}
          onSelectAppointment={setSelectedApt}
        />
      )}

      <WaitlistBanner />

      <AppointmentDetailDialog
        appointment={selectedApt}
        onClose={() => setSelectedApt(null)}
        onStatusChange={handleStatusChange}
      />
    </>
  );
}

/**
 * The week as an agenda, not as a wall of empty hours.
 *
 * The rows are the times something actually starts, so a shop that books on the
 * quarter hour gets its own rows instead of thirty-minute blocks with everything
 * crammed into the top of each. An empty run of hours is not a row at all.
 */
function WeekView({
  currentDate,
  appointments,
  staffIds,
  onSelectAppointment,
}: {
  currentDate: Date;
  appointments: CalendarAppointment[];
  staffIds: string[];
  onSelectAppointment: (apt: CalendarAppointment) => void;
}) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const days = Array.from({ length: 6 }, (_, i) => addDays(weekStart, i));

  const times = useMemo(() => {
    const distinct = new Set(
      appointments.map((appointment) => format(new Date(appointment.dateTime), "HH:mm"))
    );
    if (distinct.size === 0) return ["09:00", "11:00", "13:00", "16:00", "18:00"];
    return [...distinct].sort();
  }, [appointments]);

  return (
    <div className="overflow-x-auto rounded-[14px] border border-border bg-card">
      <div
        className="grid min-w-[760px]"
        style={{ gridTemplateColumns: "56px repeat(6, minmax(0, 1fr))" }}
      >
        <div className="border-r border-border-subtle" />
        {days.map((day) => (
          <div
            key={day.toISOString()}
            className={cn(
              "px-2 py-3 text-center",
              !isSameDay(day, days[days.length - 1]) && "border-r border-border-subtle",
              isToday(day) && "bg-primary/[0.04]"
            )}
          >
            <p className="text-[9px] uppercase tracking-[0.1em] text-faint">
              {format(day, "EEE", { locale: es })}
            </p>
            <p className={cn("mt-0.5 text-base font-bold", isToday(day) && "text-jade-label")}>
              {format(day, "d")}
            </p>
          </div>
        ))}

        {times.map((time) => (
          <div key={time} className="contents">
            <div className="border-r border-t border-border-subtle p-2 text-right font-mono text-[9px] text-faint">
              {time}
            </div>
            {days.map((day, index) => {
              const cell = appointments.filter(
                (appointment) =>
                  isSameDay(new Date(appointment.dateTime), day) &&
                  format(new Date(appointment.dateTime), "HH:mm") === time
              );

              return (
                <div
                  key={`${day.toISOString()}-${time}`}
                  className={cn(
                    "border-t border-border-subtle p-1",
                    index < days.length - 1 && "border-r",
                    isToday(day) && "bg-primary/[0.04]"
                  )}
                >
                  {cell.length === 0 ? (
                    <Link
                      href="/panel/turnos?nuevo=1"
                      className="block rounded-[7px] border border-dashed border-disabled px-2 py-[7px] text-center text-[9.5px] text-faint transition-colors hover:border-primary hover:text-jade-label"
                    >
                      + Libre
                    </Link>
                  ) : (
                    cell.map((appointment) => (
                      <button
                        key={appointment.id}
                        type="button"
                        onClick={() => onSelectAppointment(appointment)}
                        className={cn(
                          "mb-1 block w-full rounded-[7px] border-l-[3px] px-2 py-[7px] text-left last:mb-0",
                          toneFor(appointment, staffIds)
                        )}
                      >
                        <span className="block truncate text-[10.5px] font-semibold">
                          {appointment.clientName}
                        </span>
                        <span className="block truncate text-[9px] text-muted-foreground">
                          {appointment.serviceName}
                          {suffixFor(appointment)}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function MonthView({
  currentDate,
  appointments,
  staffIds,
  onSelectAppointment,
  onSelectDate,
}: {
  currentDate: Date;
  appointments: CalendarAppointment[];
  staffIds: string[];
  onSelectAppointment: (apt: CalendarAppointment) => void;
  onSelectDate: (date: Date) => void;
}) {
  const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
  const days: Date[] = [];
  for (let day = start; day <= end; day = addDays(day, 1)) days.push(day);

  return (
    <div className="overflow-hidden rounded-[14px] border border-border bg-card">
      <div className="grid grid-cols-7 border-b border-border-subtle">
        {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((label) => (
          <div
            key={label}
            className="py-2.5 text-center text-[9px] uppercase tracking-[0.1em] text-faint"
          >
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day, index) => {
          const dayApts = appointments.filter((a) => isSameDay(new Date(a.dateTime), day));
          return (
            <div
              key={day.toISOString()}
              onClick={() => onSelectDate(day)}
              className={cn(
                "min-h-[92px] cursor-pointer border-b border-r border-border-subtle p-1.5 transition-colors hover:bg-muted/40",
                index % 7 === 6 && "border-r-0",
                !isSameMonth(day, currentDate) && "bg-muted/30 text-faint",
                isToday(day) && "bg-primary/[0.04]"
              )}
            >
              <span
                className={cn("text-[11px] font-semibold", isToday(day) && "text-jade-label")}
              >
                {format(day, "d")}
              </span>
              <div className="mt-1 space-y-1">
                {dayApts.slice(0, 3).map((appointment) => (
                  <button
                    key={appointment.id}
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelectAppointment(appointment);
                    }}
                    className={cn(
                      "block w-full truncate rounded border-l-2 px-1.5 py-0.5 text-left text-[9.5px]",
                      toneFor(appointment, staffIds)
                    )}
                  >
                    {format(new Date(appointment.dateTime), "HH:mm")}{" "}
                    {appointment.clientName.split(" ")[0]}
                  </button>
                ))}
                {dayApts.length > 3 && (
                  <span className="block text-[9.5px] text-faint">+{dayApts.length - 3} más</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DayView({
  currentDate,
  appointments,
  staffIds,
  onSelectAppointment,
}: {
  currentDate: Date;
  appointments: CalendarAppointment[];
  staffIds: string[];
  onSelectAppointment: (apt: CalendarAppointment) => void;
}) {
  const dayApts = appointments
    .filter((a) => isSameDay(new Date(a.dateTime), currentDate))
    .sort((a, b) => a.dateTime.localeCompare(b.dateTime));

  if (dayApts.length === 0) {
    return (
      <div className="rounded-[14px] border border-border bg-card py-14 text-center">
        <CalendarIcon className="mx-auto mb-3 size-8 text-disabled" aria-hidden />
        <p className="mb-1 text-[15px] font-bold">Sin turnos para este día</p>
        <p className="mb-4 text-xs text-muted-foreground">
          Tu link está publicado y la agenda abierta.
        </p>
        <Link
          href="/panel/turnos?nuevo=1"
          className="inline-block rounded-[10px] bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground transition-colors hover:bg-[#22c55e]"
        >
          + Cargar un turno
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {dayApts.map((appointment) => (
        <button
          key={appointment.id}
          type="button"
          onClick={() => onSelectAppointment(appointment)}
          className={cn(
            "flex items-center gap-3 rounded-[11px] border border-border border-l-[3px] bg-card p-3 text-left transition-colors hover:border-faint",
            toneFor(appointment, staffIds)
          )}
        >
          <span className="min-w-[42px] text-[11.5px] font-bold tabular-nums">
            {format(new Date(appointment.dateTime), "HH:mm")}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs font-semibold">{appointment.clientName}</span>
            <span className="block truncate text-[10px] text-muted-foreground">
              {appointment.serviceName} · {appointment.staffName} · {appointment.serviceDuration} min
              {suffixFor(appointment)}
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}

/** The same insight the dashboard shows, where the hole is actually visible. */
function WaitlistBanner() {
  const { data } = useSWR<{ total: number }>("/api/panel/waitlist?status=pending&pageSize=1");
  if (!data?.total) return null;

  return (
    <div className="mt-3 flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5">
      <span
        className="flex size-[30px] shrink-0 items-center justify-center rounded-lg bg-jade-fill text-jade-label"
        aria-hidden
      >
        <Sparkles className="size-3.5" />
      </span>
      <p className="flex-1 text-xs text-muted-foreground">
        {data.total === 1 ? "Hay 1 persona" : `Hay ${data.total} personas`} en lista de espera
        buscando un lugar.
      </p>
      <Link
        href="/panel/lista-espera"
        className="shrink-0 rounded-lg bg-primary px-4 py-2 text-[11.5px] font-bold text-primary-foreground transition-colors hover:bg-[#22c55e]"
      >
        Ofrecer el hueco
      </Link>
    </div>
  );
}
