"use client";

import { useState } from "react";
import useSWR from "swr";
import { Search } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { TableSkeleton } from "@/components/skeletons/dashboard-skeleton";


const roleLabels: Record<string, string> = {
  PLATFORM_ADMIN: "Admin",
  BUSINESS_OWNER: "Propietario",
  BUSINESS_MANAGER: "Manager",
  STAFF_MEMBER: "Staff",
  RECEPTIONIST: "Recepcionista",
  CLIENT: "Cliente",
};

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data, isLoading } = useSWR(
    `/api/admin/users?page=${page}&limit=20&q=${encodeURIComponent(search)}`);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Usuarios</h1>
        <p className="text-muted-foreground text-sm mt-1">Todos los usuarios de la plataforma</p>
      </div>

      <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2 w-full max-w-md">
        <Search className="w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Buscar por nombre o email..."
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
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Rol</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Negocios</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Creado</th>
                </tr>
              </thead>
              <tbody>
                {(data?.data || []).map((user: Record<string, unknown>) => {
                  const counts = user._count as Record<string, number>;
                  return (
                    <tr key={user.id as string} className="border-b border-border/50 hover:bg-muted/20">
                      <td className="px-4 py-3 font-medium">{user.name as string || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{user.email as string}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                          {roleLabels[user.role as string] || (user.role as string)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{counts.businesses}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {format(new Date(user.createdAt as string), "d MMM yyyy", { locale: es })}
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
