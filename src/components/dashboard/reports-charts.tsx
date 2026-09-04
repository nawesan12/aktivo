"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { formatCurrency } from "@/lib/format";

/**
 * The two Recharts figures of the reports page, split out so they can be
 * loaded on demand.
 *
 * Recharts is 318 KB. The other two chart screens already deferred it; this one
 * imported it statically, so every visit to /panel/reportes paid for it up
 * front, chart or no chart.
 */

const CHART_COLORS = ["#6366F1", "#22D3EE", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

const TOOLTIP_STYLE = {
  background: "#18181b",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8,
};

export function AppointmentsTimelineChart({
  data,
}: {
  data: { date: string; count: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data}>
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "#a1a1aa" }}
          tickFormatter={(d: string) => d.slice(5)}
        />
        <YAxis tick={{ fontSize: 11, fill: "#a1a1aa" }} />
        <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: "#fafafa" }} />
        <Bar dataKey="count" fill="#6366F1" radius={[4, 4, 0, 0]} name="Turnos" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function RevenueByServiceChart({
  data,
}: {
  data: { name: string; revenue: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={data}
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
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          formatter={(value?: number) => `${formatCurrency(value || 0)}`}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
