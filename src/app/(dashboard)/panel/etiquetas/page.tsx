import type { Metadata } from "next";
import { PlanGate } from "@/components/dashboard/plan-gate";
import { ClientTagsManager } from "@/components/dashboard/client-tags-manager";
import { PanelHeader } from "@/components/dashboard/panel-header";

export const metadata: Metadata = {
  title: "Etiquetas",
};

export default function Page() {
  return (
    <div className="space-y-4">
      <PanelHeader title="Etiquetas" subtitle="Agrupá clientes para segmentar campañas" />
      <PlanGate feature="Etiquetas de clientes" requiredPlan="PROFESSIONAL">
        <ClientTagsManager />
      </PlanGate>
    </div>
  );
}
