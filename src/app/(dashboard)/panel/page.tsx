"use client";

import useSWR from "swr";
import {
  Calendar,
  DollarSign,
  Users,
  TrendingUp,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { UpcomingList } from "@/components/dashboard/upcoming-list";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { DashboardSkeleton } from "@/components/skeletons/dashboard-skeleton";


function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(value);
}

export default function DashboardPage() {
  const { data, isLoading } = useSWR("/api/panel/stats", {
    refreshInterval: 60000,
  });

  if (isLoading || !data) return <DashboardSkeleton />;

  const { kpis, charts, upcoming, recentActivity } = data;

  const chartDays = (charts?.last7Days || []).map((d: { date: string; count: number }) => ({
    name: format(new Date(d.date), "EEE", { locale: es }),
    turnos: d.count,
  }));

  const chartMonths = (charts?.last6Months || []).map((m: { month: string; revenue: number }) => ({
    name: format(new Date(m.month), "MMM", { locale: es }),
    ingresos: m.revenue,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Resumen de tu negocio</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Turnos hoy"
          value={String(kpis.todayAppointments)}
          change={`${kpis.todayChange >= 0 ? "+" : ""}${kpis.todayChange} vs ayer`}
          icon={Calendar}
          trend={kpis.todayChange >= 0 ? "up" : "down"}
        />
        <KpiCard
          label="Ingresos del mes"
          value={formatCurrency(kpis.monthRevenue)}
          change={`${kpis.revenueChange >= 0 ? "+" : ""}${kpis.revenueChange}% vs mes anterior`}
          icon={DollarSign}
          trend={kpis.revenueChange >= 0 ? "up" : "down"}
        />
        <KpiCard
          label="Clientes activos"
          value={String(kpis.activeClients)}
          change={`${kpis.clientChange >= 0 ? "+" : ""}${kpis.clientChange} este mes`}
          icon={Users}
          trend={kpis.clientChange >= 0 ? "up" : "down"}
        />
        <KpiCard
          label="Tasa de ocupacion"
          value={`${kpis.occupancy}%`}
          change="del mes actual"
          icon={TrendingUp}
          trend={kpis.occupancy > 50 ? "up" : "down"}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass rounded-xl p-6">
          <h3 className="font-heading font-semibold mb-4">Turnos por dia</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartDays}>
                <defs>
                  <linearGradient id="turnosGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="turnos"
                  stroke="hsl(var(--primary))"
                  fill="url(#turnosGrad)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-xl p-6">
          <h3 className="font-heading font-semibold mb-4">Ingresos mensuales</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartMonths}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  formatter={(value) => [formatCurrency(value as number), "Ingresos"]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar
                  dataKey="ingresos"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                  opacity={0.8}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass rounded-xl p-6">
          <h3 className="font-heading font-semibold mb-4">Proximos turnos</h3>
          <UpcomingList appointments={upcoming || []} />
        </div>

        <div className="glass rounded-xl p-6">
          <h3 className="font-heading font-semibold mb-4">Actividad reciente</h3>
          <ActivityFeed activities={recentActivity || []} />
        </div>
      </div>
    </div>
  );
}
