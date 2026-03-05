import { CampaignsManager } from "@/components/dashboard/campaigns-manager";
import { NoShowTracker } from "@/components/dashboard/no-show-tracker";

export const metadata = {
  title: "Campañas | Jiku",
};

export default function CampanasPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Campañas & No-Shows</h1>
        <p className="text-muted-foreground">Automatiza comunicaciones y gestiona ausencias</p>
      </div>

      <div className="space-y-8">
        <NoShowTracker />
        <CampaignsManager />
      </div>
    </div>
  );
}
