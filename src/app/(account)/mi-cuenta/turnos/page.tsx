"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { Calendar, Search, Filter, RotateCcw, CalendarPlus, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { TableSkeleton } from "@/components/skeletons/dashboard-skeleton";
import { Input } from "@/components/ui/input";
import { downloadICS } from "@/lib/ics-generator";
import { RescheduleModal } from "@/components/booking/reschedule-modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { APPOINTMENT_STATUS_OPTIONS } from "@/lib/appointment-status";
import { NextAppointmentCard } from "@/components/account/next-appointment";

interface Appointment {
  id: string;
  dateTime: string;
  status: string;
  serviceId: string;
  staffId: string;
  service: { id: string; name: string; duration: number; price: number };
  staff: { id: string; name: string };
  business: { name: string; slug: string };
}

export default function AppointmentsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [rescheduleAppt, setRescheduleAppt] = useState<Appointment | null>(null);
  const [cancelAppt, setCancelAppt] = useState<Appointment | null>(null);

  const params = new URLSearchParams({ page: String(page), limit: "20" });
  if (statusFilter) params.set("status", statusFilter);
  if (searchQuery) params.set("search", searchQuery);
  if (dateFrom) params.set("from", dateFrom);
  if (dateTo) params.set("to", dateTo);

  const { data, isLoading, mutate } = useSWR(`/api/client/appointments?${params}`);

  if (isLoading) return <TableSkeleton />;

  const appointments: Appointment[] = data?.data || [];
  const pagination = data?.pagination;
  const now = new Date();

  /*
    The next one comes out of the list and goes above it. It was one row among
    twenty, carrying the same weight as a haircut from eighteen months ago —
    and it is the only thing anybody opens this screen for. Only when no filter
    is on: with a filter applied the list is an answer to a question, and
    pulling a row out of it would be lying about the result.
  */
  const filtering = Boolean(statusFilter || searchQuery || dateFrom || dateTo);
  const upcoming = filtering
    ? null
    : appointments.find(
        (appointment) =>
          new Date(appointment.dateTime) > now &&
          ["PENDING", "CONFIRMED", "PENDING_PAYMENT"].includes(appointment.status)
      ) ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[21px] font-bold tracking-[-0.025em]">Mis turnos</h1>
        <p className="mt-[3px] text-[12.5px] text-muted-foreground">
          {upcoming
            ? "Tu próximo turno y el historial en todos tus negocios"
            : "Historial de turnos en todos tus negocios"}
        </p>
      </div>

      {upcoming && (
        <NextAppointmentCard
          appointment={upcoming}
          onReschedule={() => setRescheduleAppt(upcoming)}
          onCancel={() => setCancelAppt(upcoming)}
        />
      )}

      {/* Filters */}
      <div className="glass rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="w-4 h-4" />
          Filtros
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="pl-9"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="h-10 px-3 bg-background border border-border rounded-lg text-sm"
          >
            <option value="">Todos los estados</option>
            {APPOINTMENT_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            placeholder="Desde"
          />
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            placeholder="Hasta"
          />
        </div>
      </div>

      {appointments.length === 0 ? (
        <div className="glass rounded-xl p-12 flex flex-col items-center justify-center">
          <Calendar className="w-10 h-10 mb-3 text-muted-foreground/30" />
          <p className="text-muted-foreground text-sm">No se encontraron turnos</p>
        </div>
      ) : (
        <>
          {/* Card layout */}
          <div className="space-y-3">
            {appointments.map((appt) => {
              const isPast = new Date(appt.dateTime) < now;
              const isUpcoming = !isPast && (appt.status === "PENDING" || appt.status === "CONFIRMED");

              return (
                <div key={appt.id} className="glass rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm">{appt.service.name}</p>
                        <StatusBadge status={appt.status} />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {appt.business.name} · {appt.staff.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(appt.dateTime), "EEEE d MMM yyyy · HH:mm", { locale: es })}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {/* Add to calendar for upcoming */}
                      {isUpcoming && (
                        <button
                          onClick={() => {
                            const start = new Date(appt.dateTime);
                            const end = new Date(start.getTime() + appt.service.duration * 60 * 1000);
                            downloadICS({
                              title: `${appt.service.name} - ${appt.business.name}`,
                              description: `Turno con ${appt.staff.name}`,
                              start,
                              end,
                            });
                          }}
                          className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                          title="Agregar al calendario"
                        >
                          <CalendarPlus className="w-4 h-4" />
                        </button>
                      )}

                      {/* Reschedule for upcoming */}
                      {isUpcoming && (
                        <button
                          onClick={() => setRescheduleAppt(appt)}
                          className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-primary transition-colors"
                          title="Reprogramar"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      )}

                      {/* Rebook for past completed */}
                      {isPast && appt.status === "COMPLETED" && (
                        <Link
                          href={`/${appt.business.slug}/reservar?serviceId=${appt.serviceId}&staffId=${appt.staffId}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Volver a reservar
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Página {pagination.page} de {pagination.pages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="h-8 px-3 rounded-lg border border-border text-xs disabled:opacity-50 hover:bg-muted"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                  disabled={page >= pagination.pages}
                  className="h-8 px-3 rounded-lg border border-border text-xs disabled:opacity-50 hover:bg-muted"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Reschedule modal */}
      {rescheduleAppt && (
        <RescheduleModal
          appointmentId={rescheduleAppt.id}
          slug={rescheduleAppt.business.slug}
          currentDateTime={rescheduleAppt.dateTime}
          serviceDuration={rescheduleAppt.service.duration}
          serviceId={rescheduleAppt.serviceId}
          staffId={rescheduleAppt.staffId}
          rescheduleUrl={`/api/client/appointments/${rescheduleAppt.id}/reschedule`}
          onClose={() => setRescheduleAppt(null)}
          onSuccess={() => {
            setRescheduleAppt(null);
            mutate();
          }}
        />
      )}

      <ConfirmDialog
        open={Boolean(cancelAppt)}
        onOpenChange={(open) => !open && setCancelAppt(null)}
        title="¿Cancelar este turno?"
        description={
          cancelAppt
            ? `${cancelAppt.service.name} en ${cancelAppt.business.name}, ${format(
                new Date(cancelAppt.dateTime),
                "EEEE d 'de' MMMM 'a las' HH:mm",
                { locale: es }
              )}. Le avisamos al local.`
            : ""
        }
        confirmLabel="Sí, cancelar"
        cancelLabel="No, dejarlo"
        destructive
        onConfirm={async () => {
          if (!cancelAppt) return;
          await fetch(`/api/client/appointments/${cancelAppt.id}`, { method: "PATCH" });
          setCancelAppt(null);
          mutate();
        }}
      />
    </div>
  );
}
