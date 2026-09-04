"use client";

import useSWR from "swr";
import { AlertTriangle, ShieldAlert, Ban, TrendingUp } from "lucide-react";
import { TableSkeleton } from "@/components/skeletons/dashboard-skeleton";
import Link from "next/link";


export function NoShowTracker() {
  const { data, isLoading } = useSWR("/api/panel/no-shows", {
    refreshInterval: 300000,
    revalidateOnFocus: true,
  });
  const { data: penaltiesData, mutate: mutatePenalties } = useSWR("/api/panel/penalties");

  if (isLoading) return <TableSkeleton rows={4} />;

  const handleLiftPenalty = async (penaltyId: string) => {
    try {
      const res = await fetch(`/api/panel/penalties/${penaltyId}`, { method: "PATCH" });
      if (!res.ok) throw new Error("Error al levantar penalización");
      mutatePenalties();
    } catch {
      // silently fail
    }
  };

  const stats = data || { totalNoShows: 0, recentNoShows: 0, activePenalties: 0, repeatOffenderCount: 0 };

  const cards = [
    {
      label: "Total No-Shows",
      value: stats.totalNoShows,
      icon: AlertTriangle,
      color: "text-warning-foreground",
    },
    {
      label: "Últimos 30 días",
      value: stats.recentNoShows,
      icon: TrendingUp,
      color: "text-orange-500",
    },
    {
      label: "Penalizaciones Activas",
      value: stats.activePenalties,
      icon: Ban,
      color: "text-danger-foreground",
    },
    {
      label: "Reincidentes",
      value: stats.repeatOffenderCount,
      icon: ShieldAlert,
      color: "text-rose-500",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="glass rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-muted ${card.color}`}>
                <card.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Active penalties table */}
      {penaltiesData?.penalties?.length > 0 && (
        <div className="glass rounded-xl p-6">
          <h3 className="text-sm font-medium mb-4">Penalizaciones activas</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-muted-foreground font-medium">Cliente</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">Teléfono</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">Bloqueado hasta</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">Motivo</th>
                  <th className="text-right py-2 text-muted-foreground font-medium">Acción</th>
                </tr>
              </thead>
              <tbody>
                {penaltiesData.penalties.map((p: { id: string; user?: { name: string; phone?: string }; guestClient?: { name: string; phone?: string }; blockedUntil: string; reason: string }) => (
                  <tr key={p.id} className="border-b border-border/50">
                    <td className="py-3">{p.user?.name || p.guestClient?.name || "—"}</td>
                    <td className="py-3 text-muted-foreground">{p.user?.phone || p.guestClient?.phone || "—"}</td>
                    <td className="py-3 text-muted-foreground">{new Date(p.blockedUntil).toLocaleDateString("es-AR")}</td>
                    <td className="py-3"><span className="text-xs px-2 py-0.5 rounded-full bg-danger-muted text-danger-foreground">{p.reason}</span></td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => handleLiftPenalty(p.id)}
                        className="text-xs px-3 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                      >
                        Levantar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="glass rounded-xl p-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          Configuración de No-Shows
        </h3>
        <p className="text-sm text-muted-foreground">
          Ajusta el umbral de no-shows y los días de penalización desde{" "}
          <Link href="/panel/configuracion" className="text-primary hover:underline">
            Configuración
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
