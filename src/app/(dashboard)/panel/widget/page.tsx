import type { Metadata } from "next";
import { WidgetSettings } from "@/components/dashboard/widget-settings";

export const metadata: Metadata = {
  title: "Widget",
};

export default function WidgetPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-heading font-bold">Widget</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Integra tu boton de reservas en tu sitio web
        </p>
      </div>
      <WidgetSettings />
    </div>
  );
}
