import type { Metadata } from "next";
import { WaitlistManager } from "@/components/dashboard/waitlist-manager";
import { PanelHeader } from "@/components/dashboard/panel-header";

export const metadata: Metadata = {
  title: "Lista de espera | Jiku",
};

export default function ListaEsperaPage() {
  return (
    <div className="space-y-4">
      <PanelHeader title="Lista de espera" subtitle="Gestiona los clientes en lista de espera" />
      <WaitlistManager />
    </div>
  );
}
