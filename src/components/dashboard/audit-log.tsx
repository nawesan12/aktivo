"use client";

import { useState } from "react";
import useSWR from "swr";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Shield,
} from "lucide-react";
import { TableSkeleton } from "@/components/skeletons/dashboard-skeleton";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface AuditEntry {
  id: string;
  action: string;
  entity: string;
  entityId?: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
  user?: { id: string; name: string | null; email: string } | null;
}

export function AuditLog() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState("");
  const [entity, setEntity] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const params = new URLSearchParams({ page: String(page), pageSize: "20" });
  if (action) params.set("action", action);
  if (entity) params.set("entity", entity);
  if (dateFrom) params.set("dateFrom", dateFrom);
  if (dateTo) params.set("dateTo", dateTo);

  const { data, isLoading } = useSWR(`/api/panel/audit?${params.toString()}`, fetcher);

  if (isLoading) return <TableSkeleton rows={8} />;

  const logs: AuditEntry[] = data?.data || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 };

  const entities = ["Appointment", "Service", "ServiceCategory", "StaffMember", "Business", "BusinessSettings", "Payment"];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="glass rounded-xl p-4 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Filtrar por accion..."
          value={action}
          onChange={(e) => { setAction(e.target.value); setPage(1); }}
          className="h-9 px-3 rounded-lg bg-muted/50 border border-border text-sm flex-1 min-w-[150px] outline-none focus:ring-2 focus:ring-primary"
        />
        <select
          value={entity}
          onChange={(e) => { setEntity(e.target.value); setPage(1); }}
          className="h-9 px-3 rounded-lg bg-muted/50 border border-border text-sm"
        >
          <option value="">Todas las entidades</option>
          {entities.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
        <div className="flex items-center gap-2">
          <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="h-9 px-3 rounded-lg bg-muted/50 border border-border text-sm" />
          <span className="text-xs text-muted-foreground">a</span>
          <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className="h-9 px-3 rounded-lg bg-muted/50 border border-border text-sm" />
        </div>
      </div>

      {/* Table */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="p-3 text-xs font-medium text-muted-foreground">Fecha</th>
                <th className="p-3 text-xs font-medium text-muted-foreground">Usuario</th>
                <th className="p-3 text-xs font-medium text-muted-foreground">Accion</th>
                <th className="p-3 text-xs font-medium text-muted-foreground">Entidad</th>
                <th className="p-3 text-xs font-medium text-muted-foreground w-10"></th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center">
                    <Shield className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-muted-foreground text-sm">Sin registros de auditoria</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <>
                    <tr key={log.id} className="border-b border-border/50 hover:bg-muted/10 transition-colors">
                      <td className="p-3">
                        <p className="text-sm">{format(new Date(log.createdAt), "dd/MM/yy HH:mm", { locale: es })}</p>
                      </td>
                      <td className="p-3">
                        <p className="text-sm">{log.user?.name || "Sistema"}</p>
                        {log.user?.email && (
                          <p className="text-[10px] text-muted-foreground">{log.user.email}</p>
                        )}
                      </td>
                      <td className="p-3">
                        <span className="text-sm font-mono text-xs bg-muted/50 px-1.5 py-0.5 rounded">
                          {log.action}
                        </span>
                      </td>
                      <td className="p-3">
                        <p className="text-sm">{log.entity}</p>
                        {log.entityId && (
                          <p className="text-[10px] text-muted-foreground font-mono">{log.entityId.slice(0, 8)}...</p>
                        )}
                      </td>
                      <td className="p-3">
                        {log.details && (
                          <button
                            onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                            className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center"
                          >
                            {expandedId === log.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        )}
                      </td>
                    </tr>
                    {expandedId === log.id && log.details && (
                      <tr key={`${log.id}-detail`}>
                        <td colSpan={5} className="p-3 bg-muted/10">
                          <pre className="text-xs font-mono overflow-x-auto p-3 rounded-lg bg-muted/30">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between p-3 border-t border-border">
            <p className="text-xs text-muted-foreground">{pagination.total} registro{pagination.total !== 1 ? "s" : ""}</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center disabled:opacity-50">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs px-2">{page} / {pagination.totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))} disabled={page >= pagination.totalPages} className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center disabled:opacity-50">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
