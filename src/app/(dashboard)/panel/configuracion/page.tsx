import type { Metadata } from "next";
import { BusinessSettings } from "@/components/dashboard/business-settings";

export const metadata: Metadata = {
  title: "Configuracion",
};

export default function ConfiguracionPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-heading font-bold">Configuracion</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Ajustes generales de tu negocio
        </p>
      </div>
      <BusinessSettings />
    </div>
  );
}
