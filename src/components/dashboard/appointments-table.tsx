"use client";

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
} from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "./status-badge";
import { AppointmentDetailDialog } from "./appointment-detail-dialog";
import { TableSkeleton } from "@/components/skeletons/dashboard-skeleton";


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
  { value: "PENDING_PAYMENT", label: "Pago pendiente" },
  { value: "PENDING", label: "Pendiente" },
  { value: "CONFIRMED", label: "Confirmado" },
  { value: "COMPLETED", label: "Completado" },
  { value: "CANCELLED", label: "Cancelado" },
  { value: "NO_SHOW", label: "No asistió" },
];

export function AppointmentsTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mutatingId, setMutatingId] = useState<string | null>(null);

  const params = new URLSearchParams({ page: String(page), pageSize: "20" });
  if (search) params.set("search", search);
  if (statusFilter) params.set("status", statusFilter);
  if (dateFrom) params.set("dateFrom", dateFrom);
  if (dateTo) params.set("dateTo", dateTo);

  const { data, isLoading, mutate } = useSWR(
    `/api/panel/appointments?${params.toString()}`, { refreshInterval: 30000 }
  );

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
        setOpenMenu(null);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Error al actualizar");
      } finally {
        setMutatingId(null);
      }
    },
    [mutate]
  );

  if (isLoading) return <TableSkeleton rows={8} />;

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
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            className="h-9 px-3 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary"
          />
          <span className="text-xs text-muted-foreground">a</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            className="h-9 px-3 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Table */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
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
                    <p className="text-muted-foreground text-sm">No hay turnos</p>
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
                      <div className="relative">
                        <button
                          onClick={() => setOpenMenu(openMenu === apt.id ? null : apt.id)}
                          disabled={mutatingId === apt.id}
                          className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center disabled:opacity-50"
                        >
                          {mutatingId === apt.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <MoreHorizontal className="w-4 h-4" />
                          )}
                        </button>
                        {openMenu === apt.id && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setOpenMenu(null)} />
                            <div className="absolute right-0 top-full mt-1 z-50 w-44 rounded-lg border border-border bg-card shadow-lg py-1">
                              <button
                                onClick={() => { setSelectedApt(apt); setOpenMenu(null); }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" /> Ver detalle
                              </button>
                              {(apt.status === "PENDING" || apt.status === "PENDING_PAYMENT") && (
                                <button
                                  onClick={() => handleStatusChange(apt.id, "CONFIRMED")}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors text-blue-500"
                                >
                                  <Check className="w-3.5 h-3.5" /> Confirmar
                                </button>
                              )}
                              {apt.status === "CONFIRMED" && (
                                <>
                                  <button
                                    onClick={() => handleStatusChange(apt.id, "COMPLETED")}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors text-emerald-500"
                                  >
                                    <CheckCheck className="w-3.5 h-3.5" /> Completar
                                  </button>
                                  <button
                                    onClick={() => handleStatusChange(apt.id, "NO_SHOW")}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors text-zinc-400"
                                  >
                                    <UserX className="w-3.5 h-3.5" /> No asistió
                                  </button>
                                </>
                              )}
                              {!["COMPLETED", "CANCELLED", "NO_SHOW"].includes(apt.status) && (
                                <button
                                  onClick={() => handleStatusChange(apt.id, "CANCELLED")}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors text-red-500"
                                >
                                  <XCircle className="w-3.5 h-3.5" /> Cancelar
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
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

      {/* Detail dialog */}
      <AppointmentDetailDialog
        appointment={selectedApt}
        onClose={() => setSelectedApt(null)}
        onStatusChange={handleStatusChange}
      />
    </>
  );
}
