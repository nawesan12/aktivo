import type { Metadata } from "next";
import { PublicSiteEditor } from "@/components/dashboard/public-site-editor";
import { PanelHeader } from "@/components/dashboard/panel-header";
import { CustomDomain } from "@/components/dashboard/custom-domain";

export const metadata: Metadata = {
  title: "Mi web",
};

export default function MiWebPage() {
  return (
    <div className="space-y-4">
      <PanelHeader title="Mi web" subtitle="Cómo te ven tus clientes cuando abren tu link" />
      <PublicSiteEditor />
      {/* El dominio propio es la dirección de esta misma web, no un ajuste
          operativo: estaba en Configuración porque ahí vivía el perfil. */}
      <CustomDomain />
    </div>
  );
}
