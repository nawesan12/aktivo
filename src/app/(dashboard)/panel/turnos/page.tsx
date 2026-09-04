import type { Metadata } from "next";
import { Suspense } from "react";
import { getSessionBusiness } from "@/lib/auth/session-business";
import { requirePermission } from "@/lib/auth/rbac";
import { appointmentListKey, listAppointments } from "@/lib/panel/appointments";
import { AppointmentsTable } from "@/components/dashboard/appointments-table";
import { PanelHeader } from "@/components/dashboard/panel-header";

export const metadata: Metadata = {
  title: "Gestión de Turnos",
};

/**
 * The first page of appointments is queried while this renders, so the table
 * arrives filled in instead of showing a skeleton and then fetching.
 */
export default async function TurnosPage() {
  const session = await getSessionBusiness();
  requirePermission(session.role, "appointments:read");

  const initialData = await listAppointments(session.businessId, { page: 1, pageSize: 20 });

  return (
    <div className="space-y-4">
      <PanelHeader title="Gestión de Turnos" subtitle="Administrá y gestioná todos los turnos de tu negocio" />
      {/* Required for the prerender: the table reads `?search=` so other
          screens can link straight to one turno, and that is only known at
          request time. The server-rendered rows still ship inside the boundary. */}
      <Suspense fallback={null}>
        <AppointmentsTable
          initialKey={appointmentListKey({ page: 1, pageSize: 20 })}
          initialData={initialData}
        />
      </Suspense>
    </div>
  );
}
