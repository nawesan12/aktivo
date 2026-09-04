import type { Metadata } from "next";
import { ServicesManager } from "@/components/dashboard/services-manager";
import { PanelHeader } from "@/components/dashboard/panel-header";

export const metadata: Metadata = {
  title: "Servicios",
};

export default function ServiciosPage() {
  return (
    <div className="space-y-4">
      <PanelHeader title="Servicios" subtitle="Gestiona los servicios que ofrece tu negocio" />
      <ServicesManager />
    </div>
  );
}
