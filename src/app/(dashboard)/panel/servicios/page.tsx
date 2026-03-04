import type { Metadata } from "next";
import { ServicesManager } from "@/components/dashboard/services-manager";

export const metadata: Metadata = {
  title: "Servicios",
};

export default function ServiciosPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-heading font-bold">Servicios</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gestiona los servicios que ofrece tu negocio
        </p>
      </div>
      <ServicesManager />
    </div>
  );
}
