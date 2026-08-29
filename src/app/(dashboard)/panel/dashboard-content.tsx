"use client";

import useSWR from "swr";
import {
  Calendar,
  DollarSign,
  Users,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { UpcomingList } from "@/components/dashboard/upcoming-list";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { DashboardSkeleton } from "@/components/skeletons/dashboard-skeleton";
import { formatCurrency } from "@/lib/format";
import type { DashboardStats } from "@/lib/panel/dashboard-stats";
import dynamic from "next/dynamic";

/**
 * Recharts is the heaviest thing the panel loads and only this screen uses it,
 * below the fold. Deferring it lets the KPIs paint first.
 */
const chartFallback = <div className="h-full w-full animate-pulse rounded-lg bg-muted/30" />;

const AppointmentsPerDayChart = dynamic(
  () => import("@/components/dashboard/charts/dashboard-charts").then((m) => m.AppointmentsPerDayChart),
  { ssr: false, loading: () => chartFallback }
);

const MonthlyRevenueChart = dynamic(
  () => import("@/components/dashboard/charts/dashboard-charts").then((m) => m.MonthlyRevenueChart),
  { ssr: false, loading: () => chartFallback }
);


/**
 * Renders the numbers the server already resolved, and keeps them fresh.
 *
 * `fallbackData` is what turns this from "skeleton, then fetch" into "the page
 * arrives with its data": the first paint has the KPIs, and SWR only takes over
 * for the minute-by-minute refresh.
 */
export function DashboardContent({ initialStats }: { initialStats: DashboardStats }) {
  const { data } = useSWR<DashboardStats>("/api/panel/stats", {
    fallbackData: initialStats,
    refreshInterval: 60000,
  });

  // `data` is never empty: the server-rendered stats are the fallback. Checking
  // `isLoading` here would put the skeleton back over data we already have.
  if (!data) return <DashboardSkeleton />;

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
          label="Tasa de ocupación"
          value={`${kpis.occupancy}%`}
          change="del mes actual"
          icon={TrendingUp}
          trend={kpis.occupancy > 50 ? "up" : "down"}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass rounded-xl p-6">
          <h3 className="font-heading font-semibold mb-4">Turnos por día</h3>
          <div className="h-56">
            <AppointmentsPerDayChart data={chartDays} />
          </div>
        </div>

        <div className="glass rounded-xl p-6">
          <h3 className="font-heading font-semibold mb-4">Ingresos mensuales</h3>
          <div className="h-56">
            <MonthlyRevenueChart data={chartMonths} />
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass rounded-xl p-6">
          <h3 className="font-heading font-semibold mb-4">Próximos turnos</h3>
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
