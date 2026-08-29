"use client";

import { Download } from "lucide-react";
import { downloadCSV } from "@/lib/csv-export";
import { formatCurrency } from "@/lib/format";

interface TimelineEntry {
  period: string;
  revenue: number;
  count: number;
}

interface BreakdownEntry {
  name: string;
  revenue: number;
  count: number;
}

interface RevenueData {
  timeline: TimelineEntry[];
  byService: BreakdownEntry[];
  byStaff: BreakdownEntry[];
  totalRevenue: number;
  totalAppointments: number;
}

interface AnalyticsRevenueChartProps {
  data: RevenueData;
}

function formatARS(value: number) {
  return `${formatCurrency(value)}`;
}

export function AnalyticsRevenueChart({ data }: AnalyticsRevenueChartProps) {
  const { timeline, byService, byStaff, totalRevenue, totalAppointments } = data;

  const maxRevenue = Math.max(...timeline.map((t) => t.revenue), 1);

  const handleExport = () => {
    downloadCSV(
      timeline.map((t) => ({
        Período: t.period,
        Ingresos: t.revenue,
        Turnos: t.count,
      })),
      "ingresos.csv"
    );
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-bold">{formatARS(totalRevenue)}</p>
          <p className="text-sm text-muted-foreground">Ingresos Totales</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-bold">{totalAppointments}</p>
          <p className="text-sm text-muted-foreground">Turnos Totales</p>
        </div>
      </div>

      {/* Timeline Bar Chart */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-muted-foreground">Ingresos por período</h3>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar CSV
          </button>
        </div>
        <div className="space-y-2">
          {timeline.map((entry) => (
            <div key={entry.period} className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-24 shrink-0 text-right">
                {entry.period}
              </span>
              <div className="flex-1 h-6 bg-muted rounded-lg overflow-hidden">
                <div
                  className="h-full brand-gradient rounded-lg transition-all duration-300"
                  style={{ width: `${(entry.revenue / maxRevenue) * 100}%` }}
                />
              </div>
              <span className="text-xs font-medium w-24 shrink-0">
                {formatARS(entry.revenue)}
              </span>
            </div>
          ))}
          {timeline.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">Sin datos disponibles</p>
          )}
        </div>
      </div>

      {/* Breakdown Tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* By Service */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Por servicio</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground text-xs">
                  <th className="text-left py-2 font-medium">Servicio</th>
                  <th className="text-right py-2 font-medium">Ingresos</th>
                  <th className="text-right py-2 font-medium">Turnos</th>
                </tr>
              </thead>
              <tbody>
                {byService.map((row) => (
                  <tr key={row.name} className="border-t border-border/50">
                    <td className="py-2">{row.name}</td>
                    <td className="py-2 text-right">{formatARS(row.revenue)}</td>
                    <td className="py-2 text-right text-muted-foreground">{row.count}</td>
                  </tr>
                ))}
                {byService.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-muted-foreground">—</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* By Staff */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Por profesional</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground text-xs">
                  <th className="text-left py-2 font-medium">Profesional</th>
                  <th className="text-right py-2 font-medium">Ingresos</th>
                  <th className="text-right py-2 font-medium">Turnos</th>
                </tr>
              </thead>
              <tbody>
                {byStaff.map((row) => (
                  <tr key={row.name} className="border-t border-border/50">
                    <td className="py-2">{row.name}</td>
                    <td className="py-2 text-right">{formatARS(row.revenue)}</td>
                    <td className="py-2 text-right text-muted-foreground">{row.count}</td>
                  </tr>
                ))}
                {byStaff.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-muted-foreground">—</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
