"use client";

import { useState } from "react";
import useSWR from "swr";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Bell,
  MessageSquare,
  Mail,
} from "lucide-react";
import { TableSkeleton } from "@/components/skeletons/dashboard-skeleton";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Notification {
  id: string;
  channel: string;
  type: string;
  recipient: string;
  status: string;
  error?: string | null;
  sentAt?: string | null;
  createdAt: string;
  appointment?: { id: string; dateTime: string } | null;
}

const channelIcons: Record<string, typeof MessageSquare> = {
  WHATSAPP: MessageSquare,
  EMAIL: Mail,
};

const statusConfig: Record<string, { label: string; className: string }> = {
  SENT: { label: "Enviado", className: "bg-emerald-500/10 text-emerald-500" },
  PENDING: { label: "Pendiente", className: "bg-yellow-500/10 text-yellow-500" },
  FAILED: { label: "Fallido", className: "bg-red-500/10 text-red-500" },
};

const typeLabels: Record<string, string> = {
  confirmation: "Confirmacion",
  reminder: "Recordatorio",
  cancellation: "Cancelacion",
};

export function NotificationsLog() {
  const [page, setPage] = useState(1);
  const [channel, setChannel] = useState("");
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const params = new URLSearchParams({ page: String(page), pageSize: "20" });
  if (channel) params.set("channel", channel);
  if (status) params.set("status", status);
  if (dateFrom) params.set("dateFrom", dateFrom);
  if (dateTo) params.set("dateTo", dateTo);

  const { data, isLoading } = useSWR(`/api/panel/notifications?${params.toString()}`, fetcher);

  if (isLoading) return <TableSkeleton rows={8} />;

  const notifications: Notification[] = data?.data || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="glass rounded-xl p-4 flex flex-wrap gap-3">
        <select
          value={channel}
          onChange={(e) => { setChannel(e.target.value); setPage(1); }}
          className="h-9 px-3 rounded-lg bg-muted/50 border border-border text-sm"
        >
          <option value="">Todos los canales</option>
          <option value="WHATSAPP">WhatsApp</option>
          <option value="EMAIL">Email</option>
        </select>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="h-9 px-3 rounded-lg bg-muted/50 border border-border text-sm"
        >
          <option value="">Todos los estados</option>
          <option value="SENT">Enviado</option>
          <option value="PENDING">Pendiente</option>
          <option value="FAILED">Fallido</option>
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
                <th className="p-3 text-xs font-medium text-muted-foreground">Canal</th>
                <th className="p-3 text-xs font-medium text-muted-foreground">Tipo</th>
                <th className="p-3 text-xs font-medium text-muted-foreground">Destinatario</th>
                <th className="p-3 text-xs font-medium text-muted-foreground">Estado</th>
              </tr>
            </thead>
            <tbody>
              {notifications.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center">
                    <Bell className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-muted-foreground text-sm">Sin notificaciones</p>
                  </td>
                </tr>
              ) : (
                notifications.map((notif) => {
                  const ChannelIcon = channelIcons[notif.channel] || Bell;
                  const statusInfo = statusConfig[notif.status] || { label: notif.status, className: "bg-muted" };
                  return (
                    <tr key={notif.id} className="border-b border-border/50 hover:bg-muted/10 transition-colors">
                      <td className="p-3">
                        <p className="text-sm">{format(new Date(notif.createdAt), "dd/MM/yy HH:mm", { locale: es })}</p>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <ChannelIcon className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-sm">{notif.channel}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="text-sm">{typeLabels[notif.type] || notif.type}</span>
                      </td>
                      <td className="p-3">
                        <p className="text-sm text-muted-foreground truncate max-w-[200px]">{notif.recipient}</p>
                      </td>
                      <td className="p-3">
                        <span className={`text-xs px-2.5 py-0.5 rounded-full ${statusInfo.className}`}>
                          {statusInfo.label}
                        </span>
                        {notif.error && (
                          <p className="text-[10px] text-destructive mt-0.5 truncate max-w-[200px]">{notif.error}</p>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between p-3 border-t border-border">
            <p className="text-xs text-muted-foreground">{pagination.total} notificacion{pagination.total !== 1 ? "es" : ""}</p>
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
