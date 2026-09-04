import type { Metadata } from "next";
import { PlanGate } from "@/components/dashboard/plan-gate";
import { CouponsDashboard } from "@/components/dashboard/coupons-dashboard";

export const metadata: Metadata = {
  title: "Cupones",
};

export default function Page() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-heading font-bold">Cupones</h1>
        <p className="text-muted-foreground text-sm mt-1">Descuentos que tus clientes aplican al reservar</p>
      </div>
      <PlanGate feature="Cupones" requiredPlan="PROFESSIONAL">
        <CouponsDashboard />
      </PlanGate>
    </div>
  );
}
