"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  isSameMonth,
  isSameDay,
  isToday,
  startOfDay,
  endOfDay,
} from "date-fns";
import { es } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from "lucide-react";
import { StatusBadge } from "./status-badge";
import { AppointmentDetailDialog } from "./appointment-detail-dialog";
import { CalendarSkeleton } from "@/components/skeletons/dashboard-skeleton";
import { toast } from "sonner";


type ViewMode = "month" | "week" | "day";

const statusColors: Record<string, string> = {
  PENDING_PAYMENT: "bg-amber-500",
  PENDING: "bg-yellow-500",
  CONFIRMED: "bg-blue-500",
  COMPLETED: "bg-emerald-500",
  CANCELLED: "bg-red-500",
  NO_SHOW: "bg-zinc-500",
};

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

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [selectedApt, setSelectedApt] = useState<CalendarAppointment | null>(null);

  // Calculate date range for API
  const dateRange = useMemo(() => {
    if (viewMode === "month") {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      return {
        from: startOfWeek(monthStart, { weekStartsOn: 1 }),
        to: endOfWeek(monthEnd, { weekStartsOn: 1 }),
      };
    } else if (viewMode === "week") {
      return {
        from: startOfWeek(currentDate, { weekStartsOn: 1 }),
        to: endOfWeek(currentDate, { weekStartsOn: 1 }),
      };
    } else {
      return {
        from: startOfDay(currentDate),
        to: endOfDay(currentDate),
      };
    }
  }, [currentDate, viewMode]);

  const params = new URLSearchParams({
    page: "1",
    pageSize: "500",
    dateFrom: dateRange.from.toISOString(),
    dateTo: dateRange.to.toISOString(),
  });

  const { data, isLoading, mutate } = useSWR(
    `/api/panel/appointments?${params.toString()}`);

  const appointments: CalendarAppointment[] = data?.data || [];

  function navigate(direction: "prev" | "next" | "today") {
    if (direction === "today") {
      setCurrentDate(new Date());
    } else if (viewMode === "month") {
      setCurrentDate((d) => (direction === "prev" ? subMonths(d, 1) : addMonths(d, 1)));
    } else if (viewMode === "week") {
      setCurrentDate((d) => (direction === "prev" ? subWeeks(d, 1) : addWeeks(d, 1)));
    } else {
      setCurrentDate((d) => addDays(d, direction === "prev" ? -1 : 1));
    }
  }

  async function handleStatusChange(id: string, newStatus: string) {
    try {
      const res = await fetch(`/api/panel/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      toast.success("Estado actualizado");
      mutate();
      setSelectedApt(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error");
    }
  }

  const headerText = viewMode === "month"
    ? format(currentDate, "MMMM yyyy", { locale: es })
    : viewMode === "week"
      ? `Semana del ${format(startOfWeek(currentDate, { weekStartsOn: 1 }), "d MMM", { locale: es })}`
      : format(currentDate, "EEEE d 'de' MMMM yyyy", { locale: es });

  if (isLoading) return <CalendarSkeleton />;

  return (
    <>
      <div className="glass rounded-xl p-4 lg:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("prev")} className="w-9 h-9 rounded-lg border border-border hover:bg-muted flex items-center justify-center">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h2 className="font-heading font-semibold capitalize min-w-[200px] text-center">{headerText}</h2>
            <button onClick={() => navigate("next")} className="w-9 h-9 rounded-lg border border-border hover:bg-muted flex items-center justify-center">
              <ChevronRight className="w-4 h-4" />
            </button>
            <button onClick={() => navigate("today")} className="h-9 px-3 rounded-lg border border-border text-sm hover:bg-muted">
              Hoy
            </button>
          </div>

          <div className="flex rounded-lg border border-border overflow-hidden">
            {(["month", "week", "day"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`h-9 px-3 text-sm font-medium transition-colors ${
                  viewMode === mode ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
              >
                {mode === "month" ? "Mes" : mode === "week" ? "Semana" : "Dia"}
              </button>
            ))}
          </div>
        </div>

        {/* Month view */}
        {viewMode === "month" && (
          <MonthView
            currentDate={currentDate}
            appointments={appointments}
            onSelectAppointment={setSelectedApt}
            onSelectDate={(date) => { setCurrentDate(date); setViewMode("day"); }}
          />
        )}

        {/* Week view */}
        {viewMode === "week" && (
          <WeekView
            currentDate={currentDate}
            appointments={appointments}
            onSelectAppointment={setSelectedApt}
          />
        )}

        {/* Day view */}
        {viewMode === "day" && (
          <DayView
            currentDate={currentDate}
            appointments={appointments}
            onSelectAppointment={setSelectedApt}
          />
        )}
      </div>

      <AppointmentDetailDialog
        appointment={selectedApt}
        onClose={() => setSelectedApt(null)}
        onStatusChange={handleStatusChange}
      />
    </>
  );
}

function MonthView({
  currentDate,
  appointments,
  onSelectAppointment,
  onSelectDate,
}: {
  currentDate: Date;
  appointments: CalendarAppointment[];
  onSelectAppointment: (apt: CalendarAppointment) => void;
  onSelectDate: (date: Date) => void;
}) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days: Date[] = [];
  let day = calStart;
  while (day <= calEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  function getAptsForDay(date: Date) {
    return appointments.filter((a) => isSameDay(new Date(a.dateTime), date));
  }

  return (
    <div>
      <div className="grid grid-cols-7 gap-px mb-1">
        {["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"].map((d) => (
          <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px">
        {days.map((d) => {
          const dayApts = getAptsForDay(d);
          const inMonth = isSameMonth(d, currentDate);
          return (
            <div
              key={d.toISOString()}
              onClick={() => onSelectDate(d)}
              className={`min-h-[80px] lg:min-h-[100px] p-1.5 border border-border/30 rounded-lg cursor-pointer transition-colors hover:bg-muted/20 ${
                !inMonth ? "opacity-40" : ""
              } ${isToday(d) ? "bg-primary/5 border-primary/30" : ""}`}
            >
              <span className={`text-xs font-medium ${isToday(d) ? "text-primary" : ""}`}>
                {format(d, "d")}
              </span>
              <div className="mt-1 space-y-0.5">
                {dayApts.slice(0, 3).map((apt) => (
                  <div
                    key={apt.id}
                    onClick={(e) => { e.stopPropagation(); onSelectAppointment(apt); }}
                    className="flex items-center gap-1 group"
                  >
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusColors[apt.status] || "bg-gray-500"}`} />
                    <span className="text-[10px] truncate group-hover:text-primary transition-colors">
                      {format(new Date(apt.dateTime), "HH:mm")} {apt.clientName.split(" ")[0]}
                    </span>
                  </div>
                ))}
                {dayApts.length > 3 && (
                  <span className="text-[10px] text-muted-foreground">+{dayApts.length - 3} mas</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekView({
  currentDate,
  appointments,
  onSelectAppointment,
}: {
  currentDate: Date;
  appointments: CalendarAppointment[];
  onSelectAppointment: (apt: CalendarAppointment) => void;
}) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const hours = Array.from({ length: 14 }, (_, i) => i + 7); // 7am - 8pm

  function getAptsForDayHour(date: Date, hour: number) {
    return appointments.filter((a) => {
      const aptDate = new Date(a.dateTime);
      return isSameDay(aptDate, date) && aptDate.getHours() === hour;
    });
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[700px]">
        {/* Day headers */}
        <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-px mb-1">
          <div />
          {days.map((d) => (
            <div key={d.toISOString()} className={`text-center py-2 ${isToday(d) ? "text-primary" : ""}`}>
              <div className="text-xs font-medium">{format(d, "EEE", { locale: es })}</div>
              <div className={`text-lg font-bold ${isToday(d) ? "bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center mx-auto" : ""}`}>
                {format(d, "d")}
              </div>
            </div>
          ))}
        </div>

        {/* Time grid */}
        <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-px">
          {hours.map((hour) => (
            <div key={hour} className="contents">
              <div className="text-xs text-muted-foreground text-right pr-2 py-2 h-16">
                {String(hour).padStart(2, "0")}:00
              </div>
              {days.map((d) => {
                const apts = getAptsForDayHour(d, hour);
                return (
                  <div key={`${d.toISOString()}-${hour}`} className="border-t border-border/20 h-16 p-0.5 relative">
                    {apts.map((apt) => (
                      <button
                        key={apt.id}
                        onClick={() => onSelectAppointment(apt)}
                        className={`w-full text-left p-1 rounded text-[10px] leading-tight truncate ${statusColors[apt.status]?.replace("bg-", "bg-")}/20 hover:opacity-80 transition-opacity`}
                      >
                        <span className="font-medium">{format(new Date(apt.dateTime), "HH:mm")}</span>{" "}
                        {apt.clientName.split(" ")[0]}
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DayView({
  currentDate,
  appointments,
  onSelectAppointment,
}: {
  currentDate: Date;
  appointments: CalendarAppointment[];
  onSelectAppointment: (apt: CalendarAppointment) => void;
}) {
  const hours = Array.from({ length: 28 }, (_, i) => 7 + i * 0.5); // 7:00 - 20:30 in 30min slots
  const dayApts = appointments.filter((a) => isSameDay(new Date(a.dateTime), currentDate));

  function getAptsForSlot(hour: number) {
    const slotHour = Math.floor(hour);
    const slotMinute = (hour % 1) * 60;
    return dayApts.filter((a) => {
      const aptDate = new Date(a.dateTime);
      return aptDate.getHours() === slotHour && aptDate.getMinutes() === slotMinute;
    });
  }

  return (
    <div className="space-y-0">
      {hours.map((hour) => {
        const slotApts = getAptsForSlot(hour);
        const h = Math.floor(hour);
        const m = (hour % 1) * 60;
        const timeLabel = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

        return (
          <div key={hour} className="flex gap-3 border-t border-border/20 min-h-[40px]">
            <div className="w-14 text-xs text-muted-foreground text-right py-2 shrink-0">
              {m === 0 ? timeLabel : ""}
            </div>
            <div className="flex-1 py-1 space-y-1">
              {slotApts.map((apt) => (
                <button
                  key={apt.id}
                  onClick={() => onSelectAppointment(apt)}
                  className="w-full text-left p-2 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors flex items-center gap-3"
                >
                  <div className={`w-2 h-2 rounded-full shrink-0 ${statusColors[apt.status] || "bg-gray-500"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{apt.clientName}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {apt.serviceName} · {apt.staffName} · {apt.serviceDuration}min
                    </p>
                  </div>
                  <StatusBadge status={apt.status} />
                </button>
              ))}
            </div>
          </div>
        );
      })}
      {dayApts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <CalendarIcon className="w-8 h-8 mb-2 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">Sin turnos para este dia</p>
        </div>
      )}
    </div>
  );
}
