import type { Metadata } from "next";
import { PlanGate } from "@/components/dashboard/plan-gate";
import { ReferralsDashboard } from "@/components/dashboard/referrals-dashboard";

export const metadata: Metadata = {
  title: "Referidos",
};

export default function Page() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-heading font-bold">Referidos</h1>
        <p className="text-muted-foreground text-sm mt-1">Premiá a los clientes que te traen clientes</p>
      </div>
      <PlanGate feature="Referidos" requiredPlan="PROFESSIONAL">
        <ReferralsDashboard />
      </PlanGate>
    </div>
  );
}
