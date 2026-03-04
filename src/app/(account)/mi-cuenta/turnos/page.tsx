"use client";

import { useState } from "react";
import useSWR from "swr";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { TableSkeleton } from "@/components/skeletons/dashboard-skeleton";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function AppointmentsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useSWR(`/api/account/appointments?page=${page}&limit=20`, fetcher);

  if (isLoading) return <TableSkeleton />;

  const appointments = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Mis Turnos</h1>
        <p className="text-muted-foreground text-sm mt-1">Historial de turnos en todos tus negocios</p>
      </div>

      {appointments.length === 0 ? (
        <div className="glass rounded-xl p-12 flex flex-col items-center justify-center">
          <Calendar className="w-10 h-10 mb-3 text-muted-foreground/30" />
          <p className="text-muted-foreground text-sm">No tenes turnos registrados</p>
        </div>
      ) : (
        <div className="glass rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Negocio</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Servicio</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Profesional</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Fecha</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estado</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appt: Record<string, unknown>) => (
                  <tr key={appt.id as string} className="border-b border-border/50 hover:bg-muted/20">
                    <td className="px-4 py-3">{(appt.business as Record<string, string>).name}</td>
                    <td className="px-4 py-3">{(appt.service as Record<string, string>).name}</td>
                    <td className="px-4 py-3">{(appt.staff as Record<string, string>).name}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {format(new Date(appt.dateTime as string), "d MMM yyyy HH:mm", { locale: es })}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={appt.status as string} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Pagina {pagination.page} de {pagination.pages}
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
        </div>
      )}
    </div>
  );
}
