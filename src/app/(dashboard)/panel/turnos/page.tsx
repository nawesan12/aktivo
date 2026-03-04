import type { Metadata } from "next";
import { AppointmentsTable } from "@/components/dashboard/appointments-table";

export const metadata: Metadata = {
  title: "Gestion de Turnos",
};

export default function TurnosPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-heading font-bold">Gestion de Turnos</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Administra y gestiona todos los turnos de tu negocio
        </p>
      </div>
      <AppointmentsTable />
    </div>
  );
}
