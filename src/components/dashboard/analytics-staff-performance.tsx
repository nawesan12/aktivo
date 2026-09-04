"use client";

import { Download, Star } from "lucide-react";
import { downloadCSV } from "@/lib/csv-export";
import { formatCurrency } from "@/lib/format";

interface StaffPerformanceEntry {
  staffId: string;
  staffName: string;
  completedCount: number;
  revenue: number;
  avgRating: number | null;
  cancelledCount: number;
  noShowCount: number;
}

interface AnalyticsStaffPerformanceProps {
  data: StaffPerformanceEntry[];
}

function formatARS(value: number) {
  return `${formatCurrency(value)}`;
}

export function AnalyticsStaffPerformance({ data }: AnalyticsStaffPerformanceProps) {
  const topPerformerIdx = data.length
    ? data.reduce((best, curr, idx) => (curr.revenue > data[best].revenue ? idx : best), 0)
    : -1;

  const handleExport = () => {
    downloadCSV(
      data.map((s) => ({
        Profesional: s.staffName,
        "Turnos completados": s.completedCount,
        Ingresos: s.revenue,
        Calificación: s.avgRating ?? "",
        Cancelaciones: s.cancelledCount,
        Ausencias: s.noShowCount,
      })),
      "rendimiento-equipo.csv"
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Rendimiento del equipo</h3>
        <button
          onClick={handleExport}
          disabled={data.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:pointer-events-none"
        >
          <Download className="w-3.5 h-3.5" />
          Exportar CSV
        </button>
      </div>

      {data.length === 0 ? (
        // It used to render six headers over an empty tbody, with the CSV
        // button still live: clicking it downloaded a file of headers.
        <p className="text-sm text-muted-foreground py-8 text-center">
          Todavía no hay turnos completados en este período. Cuando los haya,
          acá vas a ver quién factura más y quién tiene más ausencias.
        </p>
      ) : (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-muted-foreground text-xs">
              <th className="text-left py-2 font-medium">Profesional</th>
              <th className="text-right py-2 font-medium">Turnos completados</th>
              <th className="text-right py-2 font-medium">Ingresos</th>
              <th className="text-right py-2 font-medium">Calificación</th>
              <th className="text-right py-2 font-medium">Cancelaciones</th>
              <th className="text-right py-2 font-medium">Ausencias</th>
            </tr>
          </thead>
          <tbody>
            {data.map((staff, idx) => (
              <tr
                key={staff.staffId}
                className={`border-t border-border/50 ${
                  idx === topPerformerIdx ? "bg-primary/5 font-medium" : ""
                }`}
              >
                <td className="py-2">
                  {staff.staffName}
                  {idx === topPerformerIdx && (
                    <span className="ml-1.5 text-xs text-primary">★ Top</span>
                  )}
                </td>
                <td className="py-2 text-right">{staff.completedCount}</td>
                <td className="py-2 text-right">{formatARS(staff.revenue)}</td>
                <td className="py-2 text-right">
                  {staff.avgRating != null ? (
                    <span className="inline-flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-warning-foreground fill-yellow-500" />
                      {staff.avgRating.toFixed(1)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="py-2 text-right text-muted-foreground">{staff.cancelledCount}</td>
                <td className="py-2 text-right text-muted-foreground">{staff.noShowCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
    </div>
  );
}
