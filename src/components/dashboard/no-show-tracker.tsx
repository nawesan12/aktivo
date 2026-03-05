"use client";

import useSWR from "swr";
import { AlertTriangle, ShieldAlert, Ban, TrendingUp } from "lucide-react";
import { TableSkeleton } from "@/components/skeletons/dashboard-skeleton";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function NoShowTracker() {
  const { data, isLoading } = useSWR("/api/panel/no-shows", fetcher, {
    refreshInterval: 60000,
  });

  if (isLoading) return <TableSkeleton rows={4} />;

  const stats = data || { totalNoShows: 0, recentNoShows: 0, activePenalties: 0, repeatOffenderCount: 0 };

  const cards = [
    {
      label: "Total No-Shows",
      value: stats.totalNoShows,
      icon: AlertTriangle,
      color: "text-yellow-500",
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
      color: "text-red-500",
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

      <div className="glass rounded-xl p-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          Configuración de No-Shows
        </h3>
        <p className="text-sm text-muted-foreground">
          Ajusta el umbral de no-shows y los días de penalización desde{" "}
          <a href="/panel/configuracion" className="text-primary hover:underline">
            Configuración
          </a>
          .
        </p>
      </div>
    </div>
  );
}
