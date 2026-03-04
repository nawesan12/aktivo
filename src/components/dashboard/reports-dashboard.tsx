"use client";

import { useState } from "react";
import useSWR from "swr";
import { Download, Calendar, DollarSign, Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { PermissionGate } from "@/components/auth/permission-gate";
import { DashboardSkeleton } from "@/components/skeletons/dashboard-skeleton";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const ranges = [
  { label: "7 dias", value: "7d" },
  { label: "30 dias", value: "30d" },
  { label: "90 dias", value: "90d" },
];

const CHART_COLORS = ["#6366F1", "#22D3EE", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

export function ReportsDashboard() {
  const [range, setRange] = useState("30d");
  const { data, isLoading } = useSWR(`/api/panel/reports?range=${range}`, fetcher);

  function handleExport(type: string) {
    window.open(`/api/panel/reports/export?type=${type}&format=csv`, "_blank");
  }

  if (isLoading) return <DashboardSkeleton />;

  const summary = data?.summary || { totalAppointments: 0, totalRevenue: 0, totalClients: 0 };
  const byStaff = data?.byStaff || [];
  const byService = data?.byService || [];
  const timeline = data?.timeline || [];

  return (
    <div className="space-y-6">
      {/* Range filter */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1">
          {ranges.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={cn(
                "h-8 px-3 rounded-lg text-xs font-medium transition-colors",
                range === r.value
                  ? "brand-gradient text-white"
                  : "border border-border hover:bg-muted"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
        <PermissionGate permission="reports:export">
          <div className="flex gap-2">
            <button
              onClick={() => handleExport("appointments")}
              className="h-8 px-3 rounded-lg border border-border text-xs font-medium hover:bg-muted flex items-center gap-1"
            >
              <Download className="w-3 h-3" /> Exportar Turnos CSV
            </button>
            <button
              onClick={() => handleExport("clients")}
              className="h-8 px-3 rounded-lg border border-border text-xs font-medium hover:bg-muted flex items-center gap-1"
            >
              <Download className="w-3 h-3" /> Exportar Clientes CSV
            </button>
          </div>
        </PermissionGate>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          label="Turnos"
          value={summary.totalAppointments.toString()}
          change={`Ultimos ${range === "7d" ? "7" : range === "90d" ? "90" : "30"} dias`}
          icon={Calendar}
          trend="neutral"
        />
        <KpiCard
          label="Ingresos"
          value={`$${summary.totalRevenue.toLocaleString("es-AR")}`}
          change="Pagos aprobados"
          icon={DollarSign}
          trend="neutral"
        />
        <KpiCard
          label="Clientes"
          value={summary.totalClients.toString()}
          change="Clientes unicos"
          icon={Users}
          trend="neutral"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Timeline chart */}
        <div className="glass rounded-xl p-6">
          <h3 className="font-heading font-semibold text-sm mb-4">Turnos por dia</h3>
          {timeline.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={timeline}>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "#a1a1aa" }}
                  tickFormatter={(d: string) => d.slice(5)}
                />
                <YAxis tick={{ fontSize: 11, fill: "#a1a1aa" }} />
                <Tooltip
                  contentStyle={{ background: "#18181b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
                  labelStyle={{ color: "#fafafa" }}
                />
                <Bar dataKey="count" fill="#6366F1" radius={[4, 4, 0, 0]} name="Turnos" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-sm text-muted-foreground">
              Sin datos para este periodo
            </div>
          )}
        </div>

        {/* Revenue by service */}
        <div className="glass rounded-xl p-6">
          <h3 className="font-heading font-semibold text-sm mb-4">Ingresos por servicio</h3>
          {byService.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={byService}
                  dataKey="revenue"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ name, percent }: { name?: string; percent?: number }) =>
                    `${name || ""} (${((percent || 0) * 100).toFixed(0)}%)`
                  }
                  labelLine={{ stroke: "#a1a1aa" }}
                >
                  {byService.map((_: unknown, i: number) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "#18181b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
                  formatter={(value?: number) => `$${(value || 0).toLocaleString("es-AR")}`}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-sm text-muted-foreground">
              Sin datos para este periodo
            </div>
          )}
        </div>
      </div>

      {/* By staff table */}
      {byStaff.length > 0 && (
        <div className="glass rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="font-heading font-semibold text-sm">Rendimiento por profesional</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Profesional</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Turnos</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Ingresos</th>
                </tr>
              </thead>
              <tbody>
                {byStaff.map((s: { name: string; count: number; revenue: number }) => (
                  <tr key={s.name} className="border-b border-border/50">
                    <td className="px-4 py-2 font-medium">{s.name}</td>
                    <td className="px-4 py-2 text-muted-foreground">{s.count}</td>
                    <td className="px-4 py-2 text-muted-foreground">${s.revenue.toLocaleString("es-AR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
