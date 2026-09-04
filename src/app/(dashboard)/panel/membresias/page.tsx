"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { MembershipsManager } from "@/components/dashboard/memberships-manager";
import { CouponsDashboard } from "@/components/dashboard/coupons-dashboard";
import { PanelHeader } from "@/components/dashboard/panel-header";
import { PanelTabs } from "@/components/dashboard/panel-tabs";
import { PlanGate } from "@/components/dashboard/plan-gate";

const TABS = [
  { id: "membresias", label: "Membresías" },
  { id: "cupones", label: "Cupones" },
];

/** The two ways a shop charges for something other than a single visit. */
function MembresiasTabs() {
  const searchParams = useSearchParams();
  const requested = searchParams.get("tab");
  const active = TABS.some((tab) => tab.id === requested) ? requested! : TABS[0].id;

  return (
    <>
      <PanelHeader
        title="Membresías y cupones"
        subtitle="Un abono mensual en vez de turno por turno, y descuentos para traerlos de vuelta"
      />
      <PanelTabs tabs={TABS} active={active} />

      {active === "membresias" && (
        <PlanGate feature="Membresías" requiredPlan="ENTERPRISE">
          <MembershipsManager />
        </PlanGate>
      )}
      {active === "cupones" && (
        <PlanGate feature="Cupones" requiredPlan="PROFESSIONAL">
          <CouponsDashboard />
        </PlanGate>
      )}
    </>
  );
}

export default function MembresiasPage() {
  return (
    <Suspense fallback={null}>
      <MembresiasTabs />
    </Suspense>
  );
}
