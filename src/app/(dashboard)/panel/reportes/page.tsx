import type { Metadata } from "next";
import dynamic from "next/dynamic";

// Recharts again: deferred so the page frame renders without it.
const ReportsDashboard = dynamic(() =>
  import("@/components/dashboard/reports-dashboard").then((m) => m.ReportsDashboard)
);

export const metadata: Metadata = {
  title: "Reportes",
};

export default function ReportesPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-heading font-bold">Reportes</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Análisis y métricas de tu negocio
        </p>
      </div>
      <ReportsDashboard />
    </div>
  );
}
