"use client";

import { useState } from "react";
import useSWR from "swr";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Loader2, Users, Gift, ToggleLeft, Save } from "lucide-react";
import { toast } from "sonner";

interface Referral {
  id: string;
  code: string;
  userId: string | null;
  user: { name: string | null; email: string | null } | null;
  _count: { redemptions: number };
  createdAt: string;
}

interface ReferralsResponse {
  data: Referral[];
  stats: {
    totalCodes: number;
    totalRedemptions: number;
  };
}

interface ReferralConfig {
  referralEnabled: boolean;
  referralRewardType: "PERCENTAGE" | "FIXED" | null;
  referralRewardValue: number | null;
  referralMaxRedemptions: number | null;
}

export function ReferralsDashboard() {
  const { data, isLoading } = useSWR<ReferralsResponse>("/api/panel/referrals");
  const { data: configData, mutate: mutateConfig } = useSWR<ReferralConfig>(
    "/api/panel/referrals/config"
  );

  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<ReferralConfig | null>(null);

  const activeConfig = config ?? configData ?? {
    referralEnabled: false,
    referralRewardType: "PERCENTAGE" as const,
    referralRewardValue: 10,
    referralMaxRedemptions: null,
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);

    try {
      const res = await fetch("/api/panel/referrals/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(activeConfig),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Error al guardar configuración");
        return;
      }

      await mutateConfig();
      setConfig(null);
      toast.success("Configuración de referidos guardada");
    } catch {
      toast.error("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (partial: Partial<ReferralConfig>) => {
    setConfig({ ...activeConfig, ...partial });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const stats = data?.stats ?? { totalCodes: 0, totalRedemptions: 0 };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="glass rounded-xl p-5">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Total Códigos</p>
              <p className="text-2xl font-bold">{stats.totalCodes}</p>
            </div>
          </div>
        </div>

        <div className="glass rounded-xl p-5">
          <div className="flex items-center gap-3">
            <Gift className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Canjes Totales</p>
              <p className="text-2xl font-bold">{stats.totalRedemptions}</p>
            </div>
          </div>
        </div>

        <div className="glass rounded-xl p-5">
          <div className="flex items-center gap-3">
            <ToggleLeft className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Programa</p>
              <p className="text-2xl font-bold">
                {activeConfig.referralEnabled ? "Activo" : "Inactivo"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Configuration */}
      <div className="glass rounded-xl p-6 space-y-5">
        <h3 className="text-lg font-semibold">Configuración del programa</h3>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {/* Enable toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={activeConfig.referralEnabled}
              onChange={(e) => updateConfig({ referralEnabled: e.target.checked })}
              className="h-4 w-4 rounded border-border"
            />
            <span className="text-sm text-muted-foreground">Programa habilitado</span>
          </label>

          {/* Reward type */}
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Tipo de recompensa</label>
            <select
              value={activeConfig.referralRewardType ?? "PERCENTAGE"}
              onChange={(e) =>
                updateConfig({
                  referralRewardType: e.target.value as "PERCENTAGE" | "FIXED",
                })
              }
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="PERCENTAGE">Porcentaje</option>
              <option value="FIXED">Monto fijo</option>
            </select>
          </div>

          {/* Reward value */}
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">
              Valor de recompensa{" "}
              {activeConfig.referralRewardType === "PERCENTAGE" ? "(%)" : "($)"}
            </label>
            <input
              type="number"
              min={0}
              value={activeConfig.referralRewardValue ?? ""}
              onChange={(e) =>
                updateConfig({
                  referralRewardValue: e.target.value ? Number(e.target.value) : null,
                })
              }
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              placeholder="10"
            />
          </div>

          {/* Max redemptions */}
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">
              Máx. canjes por código (vacío = ilimitado)
            </label>
            <input
              type="number"
              min={0}
              value={activeConfig.referralMaxRedemptions ?? ""}
              onChange={(e) =>
                updateConfig({
                  referralMaxRedemptions: e.target.value ? Number(e.target.value) : null,
                })
              }
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              placeholder="Ilimitado"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Guardar
          </button>
        </div>
      </div>

      {/* Referrals table */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">Referente</th>
                <th className="px-4 py-3 font-medium">Código</th>
                <th className="px-4 py-3 font-medium text-center">Canjes</th>
                <th className="px-4 py-3 font-medium">Creado</th>
              </tr>
            </thead>
            <tbody>
              {data?.data?.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    No hay códigos de referido aún
                  </td>
                </tr>
              )}
              {data?.data?.map((referral) => (
                <tr
                  key={referral.id}
                  className="border-b border-border/50 last:border-0"
                >
                  <td className="px-4 py-3">
                    {referral.user?.name || referral.user?.email || "—"}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{referral.code}</td>
                  <td className="px-4 py-3 text-center">
                    {referral._count.redemptions}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {format(new Date(referral.createdAt), "dd MMM yyyy", {
                      locale: es,
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
