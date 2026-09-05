"use client";

import { useSearchParams } from "next/navigation";
import { useState, useCallback } from "react";
import useSWR from "swr";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Eye,
  Check,
  CheckCheck,
  XCircle,
  UserX,
  Calendar as CalendarIcon,
  Loader2,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "./status-badge";
import { AppointmentDetailDialog } from "./appointment-detail-dialog";
import { NewAppointmentDialog } from "./new-appointment-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PermissionGate } from "@/components/auth/permission-gate";
import { TableSkeleton } from "@/components/skeletons/dashboard-skeleton";
import { APPOINTMENT_STATUS_OPTIONS, isTerminal } from "@/lib/appointment-status";
import type { AppointmentListPage } from "@/lib/panel/appointments";
import { useDebounced } from "@/hooks/use-debounced";


interface Appointment {
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

const statuses = [
  { value: "", label: "Todos" },
  ...APPOINTMENT_STATUS_OPTIONS,
];

export function AppointmentsTable({
  initialKey,
  initialData,
}: {
  /** SWR key the server-rendered page corresponds to. */
  initialKey?: string;
  initialData?: AppointmentListPage;
} = {}) {
  // Seeded from the URL: other screens link here to point at one turno — the
  // notifications log, for one — and without this the link landed on an
  // unfiltered agenda and left the person to find it by hand.
  const searchParams = useSearchParams();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null);
  const [mutatingId, setMutatingId] = useState<string | null>(null);
  /*
    The phone's bottom bar sends its "+" here as /panel/turnos?nuevo=1 — the
    dialog needs a URL, not a button, because the bar lives in the layout and
    the dialog's data belongs to this screen.
  */
  const [creating, setCreating] = useState(searchParams.get("nuevo") === "1");

  // Debounced: one request per keystroke otherwise.
  const debouncedSearch = useDebounced(search);

  const params = new URLSearchParams({ page: String(page), pageSize: "20" });
  if (debouncedSearch) params.set("search", debouncedSearch);
  if (statusFilter) params.set("status", statusFilter);
  if (dateFrom) params.set("dateFrom", dateFrom);
  if (dateTo) params.set("dateTo", dateTo);

  const filtering = Boolean(debouncedSearch || statusFilter || dateFrom || dateTo);

  function clearFilters() {
    setSearch("");
    setStatusFilter("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  }

  const swrKey = `/api/panel/appointments?${params.toString()}`;

  // The unfiltered first page arrives with the document; any other combination
  // of filters is fetched as before.
  const { data, isLoading, mutate } = useSWR<AppointmentListPage>(swrKey, {
    // Two minutes, and refreshed on focus. At 30 seconds this was 120
    // invocations an hour per open tab for an agenda that changes a few times
    // a day.
    refreshInterval: 120000,
    revalidateOnFocus: true,
    // Same as the dashboard: when this key is the one the server already
    // resolved, fetching it again on mount runs the query twice per visit.
    ...(swrKey === initialKey && initialData
      ? { fallbackData: initialData, revalidateOnMount: false }
      : {}),
  });
  const { data: settingsData } = useSWR("/api/panel/settings");

  async function handleExportPdf() {
    const { exportAppointmentsPdf } = await import("@/lib/pdf/export-appointments");
    const businessName = settingsData?.business?.name || "Mi Negocio";
    await exportAppointmentsPdf(appointments, businessName);
  }

  const handleStatusChange = useCallback(
    async (id: string, newStatus: string) => {
      setMutatingId(id);
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
        toast.error(error instanceof Error ? error.message : "Error al actualizar");
      } finally {
        setMutatingId(null);
      }
    },
    [mutate]
  );

  const handleNoShow = useCallback(
    async (id: string) => {
      setMutatingId(id);
      try {
        const res = await fetch(`/api/panel/appointments/${id}/no-show`, {
          method: "PATCH",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        mutate();
        if (data.penalized) {
          toast.success(`Ausencia registrada. Cliente penalizado hasta ${new Date(data.blockedUntil).toLocaleDateString("es-AR")}`);
        } else {
          toast.success(`Ausencia registrada (${data.noShowCount} ausencia${data.noShowCount !== 1 ? "s" : ""} recientes)`);
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error al registrar ausencia");
      } finally {
        setMutatingId(null);
      }
    },
    [mutate]
  );

  // `data` covers the server-rendered first page; showing the skeleton while
  // SWR revalidates would hide rows that are already on screen.
  if (isLoading && !data) return <TableSkeleton rows={8} />;

  const appointments: Appointment[] = data?.data || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 };

  return (
    <>
      {/* Filters */}
      <div className="glass rounded-xl p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por cliente..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="h-9 px-3 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary"
        >
          {statuses.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        {/* Full width on a phone: two native date inputs side by side are
            wider than the column, and this row does not wrap on its own. */}
        <div className="flex items-center gap-2 w-full sm:w-auto min-w-0">
          <input
            type="date"
            aria-label="Desde"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            className="h-9 px-2 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary min-w-0 flex-1"
          />
          <span className="text-xs text-muted-foreground shrink-0">a</span>
          <input
            type="date"
            aria-label="Hasta"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            className="h-9 px-2 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary min-w-0 flex-1"
          />
        </div>
        <PermissionGate permission="reports:export">
          <button
            onClick={handleExportPdf}
            className="h-9 px-3 rounded-lg border border-border text-xs font-medium hover:bg-muted flex items-center gap-1 shrink-0"
          >
            <FileText className="w-3 h-3" /> Exportar PDF
          </button>
        </PermissionGate>
      </div>

      {/* Table */}
      {/*
        No `overflow-hidden` on the wrapper: the actions menu of each row is
        absolutely positioned, and an ancestor that clips will clip it whatever
        its z-index. Confirming, completing or cancelling a booking is the main
        thing this screen is for, and on a phone the menu was cut off for every
        row past the first few. The rounded corners are kept with a clip on the
        scroller instead, which is where the horizontal overflow actually lives.
      */}
      <div className="glass rounded-xl">
        <div className="overflow-x-auto rounded-xl">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="p-3 text-xs font-medium text-muted-foreground">Cliente</th>
                <th className="p-3 text-xs font-medium text-muted-foreground">Servicio</th>
                <th className="p-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Profesional</th>
                <th className="p-3 text-xs font-medium text-muted-foreground">Fecha/Hora</th>
                <th className="p-3 text-xs font-medium text-muted-foreground">Estado</th>
                <th className="p-3 text-xs font-medium text-muted-foreground w-10"></th>
              </tr>
            </thead>
            <tbody>
              {appointments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <CalendarIcon className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                    {/* "No hay turnos" was the answer to two different
                        questions: an empty agenda, and a filter that matched
                        nothing. The second one looked like the business had
                        lost its bookings. */}
                    {filtering ? (
                      <>
                        <p className="text-sm">Ningún turno coincide con los filtros</p>
                        <button
                          onClick={clearFilters}
                          className="mt-3 text-sm text-primary hover:underline"
                        >
                          Limpiar filtros
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="text-sm">Todavía no tenés turnos</p>
                        <p className="text-muted-foreground text-xs mt-1">
                          Van a aparecer acá apenas alguien reserve, o podés cargar
                          uno a mano desde el botón de arriba.
                        </p>
                      </>
                    )}
                  </td>
                </tr>
              ) : (
                appointments.map((apt) => (
                  <tr key={apt.id} className="border-b border-border/50 hover:bg-muted/10 transition-colors">
                    <td className="p-3">
                      <p className="text-sm font-medium">{apt.clientName}</p>
                      <p className="text-xs text-muted-foreground">{apt.clientPhone || apt.clientEmail}</p>
                    </td>
                    <td className="p-3">
                      <p className="text-sm">{apt.serviceName}</p>
                      <p className="text-xs text-muted-foreground">{apt.serviceDuration} min</p>
                    </td>
                    <td className="p-3 hidden md:table-cell">
                      <p className="text-sm">{apt.staffName}</p>
                    </td>
                    <td className="p-3">
                      <p className="text-sm">{format(new Date(apt.dateTime), "dd/MM/yy", { locale: es })}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(apt.dateTime), "HH:mm")}</p>
                    </td>
                    <td className="p-3">
                      <StatusBadge status={apt.status} />
                    </td>
                    <td className="p-3">
                      {/*
                        A portalled menu, not an absolutely positioned div.

                        The old one lived inside the table's scroll container.
                        `overflow-x: auto` clips vertically too — the spec turns
                        the other axis into `auto` as well — so the menu opened
                        underneath the row and was cut off by the bottom of the
                        card. On a phone, where the card is short, that meant
                        pressing the three dots appeared to do nothing at all:
                        every action on every turno was unreachable.
                      */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            disabled={mutatingId === apt.id}
                            aria-label={`Acciones del turno de ${apt.clientName}`}
                            className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center disabled:opacity-50"
                          >
                            {mutatingId === apt.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <MoreHorizontal className="w-4 h-4" />
                            )}
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onSelect={() => setSelectedApt(apt)}>
                            <Eye className="w-3.5 h-3.5" /> Ver detalle
                          </DropdownMenuItem>
                          {(apt.status === "PENDING" || apt.status === "PENDING_PAYMENT") && (
                            <DropdownMenuItem
                              onSelect={() => handleStatusChange(apt.id, "CONFIRMED")}
                              className="text-info-foreground"
                            >
                              <Check className="w-3.5 h-3.5" /> Confirmar
                            </DropdownMenuItem>
                          )}
                          {apt.status === "CONFIRMED" && (
                            <>
                              <DropdownMenuItem
                                onSelect={() => handleStatusChange(apt.id, "COMPLETED")}
                                className="text-success-foreground"
                              >
                                <CheckCheck className="w-3.5 h-3.5" /> Completar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={() => handleNoShow(apt.id)}
                                className="text-neutral-foreground"
                              >
                                <UserX className="w-3.5 h-3.5" /> No asistió
                              </DropdownMenuItem>
                            </>
                          )}
                          {!isTerminal(apt.status) && (
                            <DropdownMenuItem
                              onSelect={() => handleStatusChange(apt.id, "CANCELLED")}
                              className="text-danger-foreground"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Cancelar
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between p-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              {pagination.total} turno{pagination.total !== 1 ? "s" : ""}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs px-2">
                {page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages}
                className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <NewAppointmentDialog
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={() => mutate()}
      />

      {/* Detail dialog */}
      <AppointmentDetailDialog
        appointment={selectedApt}
        onClose={() => setSelectedApt(null)}
        onStatusChange={handleStatusChange}
      />
    </>
  );
}
