import type { Metadata } from "next";
import { NotificationsLog } from "@/components/dashboard/notifications-log";

export const metadata: Metadata = {
  title: "Notificaciones",
};

export default function NotificacionesPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-heading font-bold">Notificaciones</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Historial y configuración de notificaciones
        </p>
      </div>
      <NotificationsLog />
    </div>
  );
}
