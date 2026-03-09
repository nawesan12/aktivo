"use client";

import { useState } from "react";
import useSWR from "swr";
import { Loader2, Mail, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { PermissionGate } from "@/components/auth/permission-gate";
import { TableSkeleton } from "@/components/skeletons/dashboard-skeleton";


const roleLabels: Record<string, string> = {
  BUSINESS_OWNER: "Propietario",
  BUSINESS_MANAGER: "Manager",
  STAFF_MEMBER: "Staff",
  RECEPTIONIST: "Recepcionista",
};

export function TeamManager() {
  const { data, isLoading, mutate } = useSWR("/api/panel/team");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("STAFF_MEMBER");
  const [sending, setSending] = useState(false);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setSending(true);

    try {
      const res = await fetch("/api/panel/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }

      toast.success("Invitacion enviada");
      setInviteEmail("");
      mutate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al enviar invitacion");
    } finally {
      setSending(false);
    }
  }

  async function handleRoleChange(memberId: string, newRole: string) {
    try {
      const res = await fetch(`/api/panel/team/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) throw new Error("Error al actualizar");
      toast.success("Rol actualizado");
      mutate();
    } catch {
      toast.error("Error al actualizar el rol");
    }
  }

  async function handleDeactivate(memberId: string) {
    try {
      const res = await fetch(`/api/panel/team/${memberId}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      toast.success("Miembro desactivado");
      mutate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error");
    }
  }

  if (isLoading) return <TableSkeleton rows={3} />;

  const members = data?.members || [];
  const pendingInvites = data?.pendingInvites || [];

  return (
    <div className="space-y-6">
      {/* Invite form */}
      <PermissionGate permission="team:invite">
        <form onSubmit={handleInvite} className="glass rounded-xl p-4 flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="Email del nuevo miembro"
              required
              className="w-full h-9 px-3 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
            className="h-9 px-3 rounded-lg bg-muted/50 border border-border text-sm outline-none"
          >
            <option value="BUSINESS_MANAGER">Manager</option>
            <option value="STAFF_MEMBER">Staff</option>
            <option value="RECEPTIONIST">Recepcionista</option>
          </select>
          <button
            type="submit"
            disabled={sending}
            className="h-9 px-4 rounded-lg brand-gradient text-white text-sm font-medium flex items-center gap-2 disabled:opacity-50"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            Enviar invitacion
          </button>
        </form>
      </PermissionGate>

      {/* Pending invitations */}
      {pendingInvites.length > 0 && (
        <div className="glass rounded-xl p-4">
          <h3 className="font-heading font-semibold text-sm mb-3 flex items-center gap-2">
            <Mail className="w-4 h-4" /> Invitaciones pendientes
          </h3>
          <div className="space-y-2">
            {pendingInvites.map((inv: { email: string; expires: string }) => (
              <div key={inv.email} className="flex items-center justify-between text-sm">
                <span>{inv.email}</span>
                <span className="text-xs text-muted-foreground">
                  Expira {formatDistanceToNow(new Date(inv.expires), { addSuffix: true, locale: es })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Members list */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="font-heading font-semibold text-sm">Miembros del equipo</h3>
        </div>
        {members.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No hay miembros
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {members.map((m: Record<string, unknown>) => {
              const user = m.user as Record<string, string>;
              return (
                <div key={m.id as string} className={`flex items-center gap-4 px-4 py-3 ${!m.isActive ? "opacity-50" : ""}`}>
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-primary">
                      {(user.name || "U").charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <PermissionGate permission="team:manage">
                    <select
                      value={m.role as string}
                      onChange={(e) => handleRoleChange(m.id as string, e.target.value)}
                      className="h-8 px-2 rounded-lg bg-muted/50 border border-border text-xs outline-none"
                    >
                      <option value="BUSINESS_OWNER">Propietario</option>
                      <option value="BUSINESS_MANAGER">Manager</option>
                      <option value="STAFF_MEMBER">Staff</option>
                      <option value="RECEPTIONIST">Recepcionista</option>
                    </select>
                  </PermissionGate>
                  <PermissionGate permission="team:manage" fallback={
                    <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                      {roleLabels[m.role as string] || (m.role as string)}
                    </span>
                  }>
                    {(m.isActive as boolean) && (
                      <button
                        onClick={() => handleDeactivate(m.id as string)}
                        className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center text-destructive"
                        title="Desactivar"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </PermissionGate>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
