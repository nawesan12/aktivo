"use client";

import { useState } from "react";
import useSWR from "swr";
import { Loader2, Shield, Info } from "lucide-react";
import { toast } from "sonner";
import { FormSkeleton } from "@/components/skeletons/dashboard-skeleton";


export default function SecurityPage() {
  const { data, isLoading } = useSWR("/api/account/profile");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }

      toast.success("Contrasena actualizada");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al cambiar contrasena");
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) return <FormSkeleton />;

  if (!data?.hasPassword) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-heading font-bold">Seguridad</h1>
          <p className="text-muted-foreground text-sm mt-1">Administra tu contrasena</p>
        </div>
        <div className="glass rounded-xl p-6 flex items-start gap-3">
          <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-sm">Cuenta de Google</p>
            <p className="text-muted-foreground text-sm mt-1">
              Tu cuenta usa Google para iniciar sesion. Gestiona tu contrasena desde la configuracion de tu cuenta de Google.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Seguridad</h1>
        <p className="text-muted-foreground text-sm mt-1">Cambia tu contrasena</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="glass rounded-xl p-6 space-y-4">
          <h3 className="font-heading font-semibold flex items-center gap-2">
            <Shield className="w-4 h-4" /> Cambiar contrasena
          </h3>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Contrasena actual</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full max-w-md h-10 px-3 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Nueva contrasena</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              className="w-full max-w-md h-10 px-3 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Confirmar nueva contrasena</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full max-w-md h-10 px-3 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="h-10 px-6 rounded-lg brand-gradient text-white font-medium text-sm disabled:opacity-50 flex items-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Cambiar contrasena
          </button>
        </div>
      </form>
    </div>
  );
}
