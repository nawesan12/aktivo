import type { Metadata } from "next";
import { PlanGate } from "@/components/dashboard/plan-gate";
import { ReferralsDashboard } from "@/components/dashboard/referrals-dashboard";
import { PanelHeader } from "@/components/dashboard/panel-header";

export const metadata: Metadata = {
  title: "Referidos",
};

export default function Page() {
  return (
    <div className="space-y-4">
      <PanelHeader title="Referidos" subtitle="Premiá a los clientes que te traen clientes" />
      <PlanGate feature="Referidos" requiredPlan="PROFESSIONAL">
        <ReferralsDashboard />
      </PlanGate>
    </div>
  );
}
