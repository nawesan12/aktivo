import type { Metadata } from "next";
import { MembershipsManager } from "@/components/dashboard/memberships-manager";

export const metadata: Metadata = {
  title: "Membresías",
};

export default function MembresiasPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-heading font-bold">Membresías</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Cobrá un abono mensual en vez de turno por turno
        </p>
      </div>
      <MembershipsManager />
    </div>
  );
}
