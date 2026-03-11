"use client";

import { useState } from "react";
import useSWR from "swr";
import { Search } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { TableSkeleton } from "@/components/skeletons/dashboard-skeleton";


const plans = ["STARTER", "PROFESSIONAL", "ENTERPRISE"];

export default function AdminBusinessesPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data, isLoading, mutate } = useSWR(
    `/api/admin/businesses?page=${page}&limit=20&q=${encodeURIComponent(search)}`);

  async function handleUpdate(id: string, updates: Record<string, unknown>) {
    try {
      const res = await fetch(`/api/admin/businesses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Error al actualizar");
      toast.success("Negocio actualizado");
      mutate();
    } catch {
      toast.error("Error al actualizar");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Negocios</h1>
        <p className="text-muted-foreground text-sm mt-1">Todos los negocios de la plataforma</p>
      </div>

      <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2 w-full max-w-md">
        <Search className="w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Buscar por nombre o slug..."
          className="bg-transparent text-sm outline-none flex-1 placeholder:text-muted-foreground"
        />
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : (
        <div className="glass rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nombre</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Slug</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Plan</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Suscripción</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Miembros</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Turnos</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Creado</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Activo</th>
                </tr>
              </thead>
              <tbody>
                {(data?.data || []).map((biz: Record<string, unknown>) => {
                  const counts = biz._count as Record<string, number>;
                  return (
                    <tr key={biz.id as string} className="border-b border-border/50 hover:bg-muted/20">
                      <td className="px-4 py-3 font-medium">{biz.name as string}</td>
                      <td className="px-4 py-3 text-muted-foreground">/{biz.slug as string}</td>
                      <td className="px-4 py-3">
                        <select
                          value={biz.plan as string}
                          onChange={(e) => handleUpdate(biz.id as string, { plan: e.target.value })}
                          className="h-7 px-2 rounded bg-muted/50 border border-border text-xs outline-none"
                        >
                          {plans.map((p) => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <SubscriptionBadge status={biz.subscriptionStatus as string | undefined} />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{counts.members}</td>
                      <td className="px-4 py-3 text-muted-foreground">{counts.appointments}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {format(new Date(biz.createdAt as string), "d MMM yyyy", { locale: es })}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleUpdate(biz.id as string, { isActive: !(biz.isActive as boolean) })}
                          className={`text-xs px-2.5 py-1 rounded-full border ${
                            biz.isActive
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                              : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                          }`}
                        >
                          {biz.isActive ? "Activo" : "Inactivo"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {data?.pagination?.pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Pagina {data.pagination.page} de {data.pagination.pages} ({data.pagination.total} total)
              </p>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="h-8 px-3 rounded-lg border border-border text-xs disabled:opacity-50 hover:bg-muted">
                  Anterior
                </button>
                <button onClick={() => setPage((p) => p + 1)} disabled={page >= data.pagination.pages} className="h-8 px-3 rounded-lg border border-border text-xs disabled:opacity-50 hover:bg-muted">
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

function SubscriptionBadge({ status }: { status?: string }) {
  if (!status) return <span className="text-xs text-muted-foreground">—</span>;
  const colors: Record<string, string> = {
    AUTHORIZED: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    PENDING: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    PAUSED: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    CANCELLED: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
    EXPIRED: "bg-red-500/10 text-red-400 border-red-500/20",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${colors[status] || "bg-muted text-muted-foreground border-border"}`}>
      {status}
    </span>
  );
}
