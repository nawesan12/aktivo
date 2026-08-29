"use client";

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
import { formatCurrency } from "@/lib/format";

/**
 * The two charts on the dashboard home.
 *
 * They live in their own module so the page can pull them in with
 * `next/dynamic`: Recharts is the heaviest dependency in the panel, and it is
 * below the fold on the one screen that uses it. The KPIs, the upcoming list
 * and the activity feed render without waiting for it.
 */

const axisTick = { fill: "hsl(var(--muted-foreground))" };

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  fontSize: "12px",
};

export function AppointmentsPerDayChart({
  data,
}: {
  data: { name: string; turnos: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="turnosGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="name" className="text-xs" tick={axisTick} />
        <YAxis className="text-xs" tick={axisTick} />
        <Tooltip contentStyle={tooltipStyle} />
        <Area
          type="monotone"
          dataKey="turnos"
          stroke="hsl(var(--primary))"
          fill="url(#turnosGrad)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function MonthlyRevenueChart({
  data,
}: {
  data: { name: string; ingresos: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="name" className="text-xs" tick={axisTick} />
        <YAxis className="text-xs" tick={axisTick} />
        <Tooltip
          formatter={(value) => [formatCurrency(value as number), "Ingresos"]}
          contentStyle={tooltipStyle}
        />
        <Bar dataKey="ingresos" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} opacity={0.8} />
      </BarChart>
    </ResponsiveContainer>
  );
}
