"use client";

import { useState } from "react";
import useSWR from "swr";
import { Activity, Users, TrendingUp, AlertTriangle, Loader2 } from "lucide-react";
import { TableSkeleton } from "@/components/skeletons/dashboard-skeleton";
import { AnalyticsRetentionChart } from "./analytics-retention-chart";
import { AnalyticsLTVChart } from "./analytics-ltv-chart";
import { AnalyticsPeakHeatmap } from "./analytics-peak-heatmap";
import { AnalyticsChurnList } from "./analytics-churn-list";

type Tab = "retention" | "ltv" | "peak" | "churn";

const tabs: { id: Tab; label: string; icon: typeof Activity }[] = [
  { id: "retention", label: "Retención", icon: TrendingUp },
  { id: "ltv", label: "LTV", icon: Users },
  { id: "peak", label: "Peak Hours", icon: Activity },
  { id: "churn", label: "Churn", icon: AlertTriangle },
];

function TabSkeleton() {
  return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );
}

export function AnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("retention");

  // KPI summary — always loaded
  const { data: summaryData, isLoading: summaryLoading } = useSWR("/api/panel/analytics");

  // Per-tab conditional fetching — only loads when tab is active
  const { data: retentionData, isLoading: retentionLoading } = useSWR(
    activeTab === "retention" ? "/api/panel/analytics/retention" : null
  );
  const { data: ltvData, isLoading: ltvLoading } = useSWR(
    activeTab === "ltv" ? "/api/panel/analytics/ltv" : null
  );
  const { data: peakData, isLoading: peakLoading } = useSWR(
    activeTab === "peak" ? "/api/panel/analytics/peak-hours" : null
  );
  const { data: churnData, isLoading: churnLoading } = useSWR(
    activeTab === "churn" ? "/api/panel/analytics/churn" : null
  );

  if (summaryLoading) return <TableSkeleton rows={8} />;

  const { retention, ltv, peakHours, churn } = summaryData || {};

  return (
    <div className="space-y-6">
      {/* Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-bold">
            {retention?.[retention.length - 1]?.retentionRate || 0}%
          </p>
          <p className="text-sm text-muted-foreground">Retención Mensual</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-bold">
            ${(ltv?.averageLTV || 0).toLocaleString("es-AR")}
          </p>
          <p className="text-sm text-muted-foreground">LTV Promedio</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-bold">{peakHours?.totalAppointments || 0}</p>
          <p className="text-sm text-muted-foreground">Turnos (90d)</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-bold">{churn?.totalAtRisk || 0}</p>
          <p className="text-sm text-muted-foreground">Clientes en Riesgo</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/50 rounded-xl p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "brand-gradient text-white"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="glass rounded-xl p-6">
        {activeTab === "retention" && (
          retentionLoading ? <TabSkeleton /> : <AnalyticsRetentionChart data={retentionData?.data || retentionData || []} />
        )}
        {activeTab === "ltv" && (
          ltvLoading ? <TabSkeleton /> : <AnalyticsLTVChart data={ltvData?.data || ltvData || { clients: [], averageLTV: 0 }} />
        )}
        {activeTab === "peak" && (
          peakLoading ? <TabSkeleton /> : <AnalyticsPeakHeatmap data={peakData?.data || peakData || { heatmap: [], busiestDay: 0, busiestHour: 0, totalAppointments: 0 }} />
        )}
        {activeTab === "churn" && (
          churnLoading ? <TabSkeleton /> : <AnalyticsChurnList data={churnData?.data || churnData || { atRiskClients: [], totalAtRisk: 0 }} />
        )}
      </div>
    </div>
  );
}
