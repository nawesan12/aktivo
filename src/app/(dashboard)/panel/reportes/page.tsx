import type { Metadata } from "next";
import { ReportsDashboard } from "@/components/dashboard/reports-dashboard";

export const metadata: Metadata = {
  title: "Reportes",
};

export default function ReportesPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-heading font-bold">Reportes</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Analisis y metricas de tu negocio
        </p>
      </div>
      <ReportsDashboard />
    </div>
  );
}
