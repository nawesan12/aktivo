import { AnalyticsDashboard } from "@/components/dashboard/analytics-dashboard";
import { WidgetSettings } from "@/components/dashboard/widget-settings";
import { PlanGate } from "@/components/dashboard/plan-gate";

export const metadata = {
  title: "Analytics",
};

export default function AnalyticsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">Métricas avanzadas y widget embebible</p>
      </div>

      <PlanGate feature="Analytics" requiredPlan="PROFESSIONAL">

        <AnalyticsDashboard />

      </PlanGate>

      <div className="pt-4 border-t border-border">
        <WidgetSettings />
      </div>
    </div>
  );
}
