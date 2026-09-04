"use client";

import { useState } from "react";
import useSWR from "swr";
import { Bell, Trash2, Clock, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { TableSkeleton } from "@/components/skeletons/dashboard-skeleton";

type WaitlistStatus = "pending" | "notified" | "expired";

interface WaitlistEntry {
  id: string;
  clientName: string;
  phone: string;
  email: string;
  serviceName: string;
  preferredDate: string;
  status: WaitlistStatus;
  notifiedAt?: string;
}

interface WaitlistResponse {
  entries: WaitlistEntry[];
  total: number;
  page: number;
  totalPages: number;
}

const filterOptions = [
  { label: "Pendientes", value: "pending" },
  { label: "Notificados", value: "notified" },
  { label: "Expirados", value: "expired" },
  { label: "Todos", value: "all" },
] as const;

type FilterValue = (typeof filterOptions)[number]["value"];

export function WaitlistManager() {
  const [filter, setFilter] = useState<FilterValue>("pending");
  const [page, setPage] = useState(1);

  const { data, isLoading, mutate } = useSWR<WaitlistResponse>(
    `/api/panel/waitlist?status=${filter}&page=${page}`,
    { refreshInterval: 300000, revalidateOnFocus: true }
  );

  const handleNotify = async (id: string) => {
    try {
      const res = await fetch(`/api/panel/waitlist/${id}/notify`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Error al notificar");
      toast.success("Cliente notificado exitosamente");
      mutate();
    } catch {
      toast.error("No se pudo notificar al cliente");
    }
  };

  const handleDiscard = async (id: string) => {
    try {
      const res = await fetch(`/api/panel/waitlist/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Error al descartar");
      toast.success("Entrada descartada");
      mutate();
    } catch {
      toast.error("No se pudo descartar la entrada");
    }
  };

  const renderBadge = (entry: WaitlistEntry) => {
    switch (entry.status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-warning-muted text-warning-foreground">
            <Clock className="w-3 h-3" />
            Esperando
          </span>
        );
      case "notified":
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-success-muted text-success-foreground">
            <CheckCircle className="w-3 h-3" />
            Notificado
            {entry.notifiedAt && (
              <span className="text-[10px] opacity-75">
                {new Date(entry.notifiedAt).toLocaleDateString("es-AR")}
              </span>
            )}
          </span>
        );
      case "expired":
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
            <XCircle className="w-3 h-3" />
            Expirado
          </span>
        );
    }
  };

  if (isLoading) return <TableSkeleton rows={5} />;

  const entries = data?.entries ?? [];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {filterOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => {
              setFilter(opt.value);
              setPage(1);
            }}
            className={`text-sm px-4 py-1.5 rounded-lg transition-colors ${
              filter === opt.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="glass rounded-xl p-6">
        {entries.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">
              No hay entradas en la lista de espera
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-muted-foreground font-medium">Nombre</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">Teléfono</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">Email</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">Servicio</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">Fecha preferida</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">Estado</th>
                  <th className="text-right py-2 text-muted-foreground font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-b border-border/50">
                    <td className="py-3">{entry.clientName}</td>
                    <td className="py-3 text-muted-foreground">{entry.phone || "—"}</td>
                    <td className="py-3 text-muted-foreground">{entry.email || "—"}</td>
                    <td className="py-3">{entry.serviceName}</td>
                    <td className="py-3 text-muted-foreground">
                      {new Date(entry.preferredDate).toLocaleDateString("es-AR")}
                    </td>
                    <td className="py-3">{renderBadge(entry)}</td>
                    <td className="py-3 text-right">
                      {entry.status === "pending" && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleNotify(entry.id)}
                            className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                          >
                            <Bell className="w-3.5 h-3.5" />
                            Notificar
                          </button>
                          <button
                            onClick={() => handleDiscard(entry.id)}
                            className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-lg bg-danger-muted text-danger-foreground hover:bg-danger-muted transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Descartar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Página {data.page} de {data.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="text-xs px-3 py-1.5 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page >= data.totalPages}
                className="text-xs px-3 py-1.5 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
