import type { Metadata } from "next";
import { PublicSiteEditor } from "@/components/dashboard/public-site-editor";
import { PanelHeader } from "@/components/dashboard/panel-header";

export const metadata: Metadata = {
  title: "Mi web",
};

export default function MiWebPage() {
  return (
    <div className="space-y-4">
      <PanelHeader title="Mi web" subtitle="Cómo te ven tus clientes cuando abren tu link" />
      <PublicSiteEditor />
    </div>
  );
}
