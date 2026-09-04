import type { Metadata } from "next";
import { PlanGate } from "@/components/dashboard/plan-gate";
import { ClientTagsManager } from "@/components/dashboard/client-tags-manager";

export const metadata: Metadata = {
  title: "Etiquetas",
};

export default function Page() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-heading font-bold">Etiquetas</h1>
        <p className="text-muted-foreground text-sm mt-1">Agrupá clientes para segmentar campañas</p>
      </div>
      <PlanGate feature="Etiquetas de clientes" requiredPlan="PROFESSIONAL">
        <ClientTagsManager />
      </PlanGate>
    </div>
  );
}
