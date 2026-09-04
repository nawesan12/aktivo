import type { Metadata } from "next";
import { PublicSiteEditor } from "@/components/dashboard/public-site-editor";

export const metadata: Metadata = {
  title: "Mi web",
};

export default function MiWebPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-heading font-bold">Mi web</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Cómo te ven tus clientes cuando abren tu link
        </p>
      </div>
      <PublicSiteEditor />
    </div>
  );
}
