"use client";

import Link from "next/link";
import useSWR from "swr";
import { format, isToday } from "date-fns";
import { es } from "date-fns/locale";
import { Sparkles } from "lucide-react";

import { KpiCard } from "@/components/dashboard/kpi-card";
import { AppointmentsBarChart } from "@/components/dashboard/appointments-bar-chart";
import { UpcomingList } from "@/components/dashboard/upcoming-list";
import { Card } from "@/components/ui/card";
import { DashboardSkeleton } from "@/components/skeletons/dashboard-skeleton";
import { formatCurrency } from "@/lib/format";
import type { DashboardStats } from "@/lib/panel/dashboard-stats";

function greeting(now: Date) {
  const hour = now.getHours();
  if (hour < 13) return "Buen día";
  if (hour < 20) return "Buenas tardes";
  return "Buenas noches";
}

/**
 * Renders the numbers the server already resolved, and keeps them fresh.
 *
 * `fallbackData` is what turns this from "skeleton, then fetch" into "the page
 * arrives with its data": the first paint has the KPIs, and SWR only takes over
 * for the minute-by-minute refresh.
 */
export function DashboardContent({
  initialStats,
  ownerName,
}: {
  initialStats: DashboardStats;
  ownerName: string;
}) {
  const { data } = useSWR<DashboardStats>("/api/panel/stats", {
    fallbackData: initialStats,
    // Each tick is a dozen queries. Five minutes is plenty for a KPI panel, and
    // coming back to the tab refreshes it anyway.
    refreshInterval: 300000,
    revalidateOnFocus: true,
  });

  // `data` is never empty: the server-rendered stats are the fallback. Checking
  // `isLoading` here would put the skeleton back over data we already have.
  if (!data) return <DashboardSkeleton />;

  const { kpis, charts, upcoming, waitlistInsight } = data;
  const now = new Date();

  const days = (charts?.last7Days ?? []).map((day) => {
    const date = new Date(day.date);
    const today = isToday(date);
    return {
      label: today ? "Hoy" : format(date, "EEE", { locale: es }).replace(/^\w/, (c) => c.toUpperCase()),
      count: day.count,
      today,
    };
  });

  return (
    <div className="space-y-4">
      {/*
        The screen opens with a sentence, not a title. "Dashboard / Resumen de tu
        negocio" told the owner where they were, which they knew — this tells
        them how the day is going, which is what they opened the panel for.
      */}
      <header className="mb-[22px]">
        <h1 className="text-[21px] font-bold tracking-[-0.025em]">
          {greeting(now)}, {ownerName}
        </h1>
        <p className="mt-[3px] text-[12.5px] text-muted-foreground">
          {format(now, "EEEE d 'de' MMMM", { locale: es }).replace(/^\w/, (c) => c.toUpperCase())} ·
          tu agenda está al <b className="text-jade-label">{kpis.occupancy}%</b> este mes
        </p>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Turnos hoy"
          value={String(kpis.todayAppointments)}
          change={`${kpis.todayChange >= 0 ? "+" : ""}${kpis.todayChange} vs ayer`}
          trend={kpis.todayChange >= 0 ? "up" : "down"}
          // The calendar opens on today, so "turnos hoy" lands exactly on them
          // without this screen having to work out what "today" means in the
          // business's timezone.
          href="/panel/calendario"
        />
        <KpiCard
          label="Ingresos del mes"
          value={formatCurrency(kpis.monthRevenue)}
          change={`${kpis.revenueChange >= 0 ? "+" : ""}${kpis.revenueChange}% vs mes anterior`}
          trend={kpis.revenueChange >= 0 ? "up" : "down"}
          href="/panel/reportes"
        />
        <KpiCard
          label="Clientes activos"
          value={String(kpis.activeClients)}
          change={`${kpis.clientChange >= 0 ? "+" : ""}${kpis.clientChange} este mes`}
          trend={kpis.clientChange >= 0 ? "up" : "down"}
          href="/panel/clientes"
        />
        <KpiCard
          label="Ocupación"
          value={`${kpis.occupancy}%`}
          change="del mes actual"
          trend="neutral"
          href="/panel/reportes"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[13px] font-bold">Turnos por día</h2>
            <span className="text-[11px] text-muted-foreground">últimos 7 días</span>
          </div>
          <AppointmentsBarChart days={days} className="flex-1" />
        </Card>

        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[13px] font-bold">Próximos turnos</h2>
            <Link href="/panel/turnos" className="text-[11px] text-jade-link hover:underline">
              Ver todos
            </Link>
          </div>
          <UpcomingList appointments={upcoming ?? []} />
        </Card>
      </div>

      {waitlistInsight && (
        <Card className="flex flex-row items-center gap-3 px-[18px] py-3.5">
          <span
            className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-jade-fill text-jade-label"
            aria-hidden
          >
            <Sparkles className="size-3.5" />
          </span>
          <p className="flex-1 text-[12.5px] text-muted-foreground">
            {waitlistInsight.people === 1 ? "Hay 1 persona" : `Hay ${waitlistInsight.people} personas`}{" "}
            esperando un lugar para el{" "}
            <b className="text-foreground">
              {format(new Date(waitlistInsight.date), "EEEE d", { locale: es })}
            </b>
            .
          </p>
          <Link
            href="/panel/lista-espera"
            className="shrink-0 rounded-lg bg-primary px-4 py-2 text-[11.5px] font-bold text-primary-foreground transition-colors hover:bg-[#22c55e]"
          >
            Ofrecer el hueco
          </Link>
        </Card>
      )}
    </div>
  );
}
