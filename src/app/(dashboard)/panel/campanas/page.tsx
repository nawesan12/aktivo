import { CampaignsManager } from "@/components/dashboard/campaigns-manager";
import { NoShowTracker } from "@/components/dashboard/no-show-tracker";
import { PlanGate } from "@/components/dashboard/plan-gate";

export const metadata = {
  title: "Campañas",
};

export default function CampanasPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Campañas & No-Shows</h1>
        <p className="text-muted-foreground">Automatiza comunicaciones y gestiona ausencias</p>
      </div>

      <div className="space-y-8">
        <PlanGate feature="Campañas" requiredPlan="PROFESSIONAL">
          <NoShowTracker />
        </PlanGate>
        <CampaignsManager />
      </div>
    </div>
  );
}
