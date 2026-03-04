"use client";

import { useState } from "react";
import useSWR from "swr";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  Users,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  ExternalLink,
} from "lucide-react";
import { StatusBadge } from "./status-badge";
import { TableSkeleton } from "@/components/skeletons/dashboard-skeleton";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Client {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  type: "registered" | "guest";
  totalAppointments: number;
  lastAppointment: string | null;
  createdAt: string;
}

interface ClientDetail {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  type: string;
  createdAt: string;
  totalSpent: number;
  appointments: {
    id: string;
    serviceName: string;
    staffName: string;
    dateTime: string;
    status: string;
    price: number;
    paymentStatus?: string | null;
    paymentAmount?: number | null;
  }[];
}

export function ClientsList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const params = new URLSearchParams({ page: String(page), pageSize: "20" });
  if (search) params.set("search", search);

  const { data, isLoading } = useSWR(`/api/panel/clients?${params.toString()}`, fetcher);
  const { data: clientDetail } = useSWR(
    selectedClientId ? `/api/panel/clients/${selectedClientId}` : null,
    fetcher
  );

  if (isLoading) return <TableSkeleton rows={8} />;

  const clients: Client[] = data?.data || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 };
  const detail: ClientDetail | null = clientDetail || null;

  return (
    <div className="flex gap-4">
      <div className="flex-1 space-y-4">
        {/* Search */}
        <div className="glass rounded-xl p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por nombre, telefono o email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full h-9 pl-9 pr-3 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Table */}
        <div className="glass rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="p-3 text-xs font-medium text-muted-foreground">Nombre</th>
                  <th className="p-3 text-xs font-medium text-muted-foreground hidden sm:table-cell">Telefono</th>
                  <th className="p-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Email</th>
                  <th className="p-3 text-xs font-medium text-muted-foreground">Turnos</th>
                  <th className="p-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">Ultimo turno</th>
                  <th className="p-3 text-xs font-medium text-muted-foreground">Fuente</th>
                </tr>
              </thead>
              <tbody>
                {clients.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center">
                      <Users className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                      <p className="text-muted-foreground text-sm">No hay clientes</p>
                    </td>
                  </tr>
                ) : (
                  clients.map((client) => (
                    <tr
                      key={`${client.type}-${client.id}`}
                      onClick={() => setSelectedClientId(client.id)}
                      className={`border-b border-border/50 hover:bg-muted/10 transition-colors cursor-pointer ${
                        selectedClientId === client.id ? "bg-primary/5" : ""
                      }`}
                    >
                      <td className="p-3">
                        <p className="text-sm font-medium">{client.name || "Sin nombre"}</p>
                      </td>
                      <td className="p-3 hidden sm:table-cell">
                        <p className="text-sm text-muted-foreground">{client.phone || "—"}</p>
                      </td>
                      <td className="p-3 hidden md:table-cell">
                        <p className="text-sm text-muted-foreground truncate max-w-[180px]">{client.email || "—"}</p>
                      </td>
                      <td className="p-3">
                        <p className="text-sm">{client.totalAppointments}</p>
                      </td>
                      <td className="p-3 hidden lg:table-cell">
                        <p className="text-sm text-muted-foreground">
                          {client.lastAppointment
                            ? format(new Date(client.lastAppointment), "dd/MM/yy", { locale: es })
                            : "—"}
                        </p>
                      </td>
                      <td className="p-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          client.type === "registered"
                            ? "bg-blue-500/10 text-blue-500"
                            : "bg-zinc-500/10 text-zinc-400"
                        }`}>
                          {client.type === "registered" ? "Registrado" : "Invitado"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between p-3 border-t border-border">
              <p className="text-xs text-muted-foreground">{pagination.total} cliente{pagination.total !== 1 ? "s" : ""}</p>
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

      {/* Client detail panel */}
      {detail && (
        <div className="w-80 shrink-0 hidden xl:block">
          <div className="glass rounded-xl p-5 sticky top-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-semibold">{detail.name || "Sin nombre"}</h3>
              <button onClick={() => setSelectedClientId(null)} className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {detail.phone && (
                <a href={`https://wa.me/${detail.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                  <Phone className="w-3.5 h-3.5" /> {detail.phone} <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {detail.email && (
                <a href={`mailto:${detail.email}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                  <Mail className="w-3.5 h-3.5" /> {detail.email}
                </a>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" /> Cliente desde {format(new Date(detail.createdAt), "MMM yyyy", { locale: es })}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="w-3.5 h-3.5" /> Total gastado: ${detail.totalSpent.toLocaleString("es-AR")}
              </div>
            </div>

            <div className="border-t border-border pt-3">
              <h4 className="text-xs font-medium text-muted-foreground mb-2">Historial de turnos</h4>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {detail.appointments.map((apt) => (
                  <div key={apt.id} className="p-2 rounded-lg bg-muted/20">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium">{apt.serviceName}</p>
                      <StatusBadge status={apt.status} className="text-[9px] px-1.5" />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {format(new Date(apt.dateTime), "dd/MM/yy HH:mm", { locale: es })} · {apt.staffName}
                    </p>
                  </div>
                ))}
                {detail.appointments.length === 0 && (
                  <p className="text-xs text-muted-foreground">Sin turnos</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
