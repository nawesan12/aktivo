"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { StaffManager } from "@/components/dashboard/staff-manager";
import { ScheduleEditor } from "@/components/dashboard/schedule-editor";
import { TeamManager } from "@/components/dashboard/team-manager";
import { PanelHeader } from "@/components/dashboard/panel-header";
import { PanelTabs } from "@/components/dashboard/panel-tabs";
import { PermissionGate } from "@/components/auth/permission-gate";

const TABS = [
  { id: "profesionales", label: "Profesionales" },
  { id: "horarios", label: "Horarios" },
  { id: "acceso", label: "Acceso al panel" },
];

/**
 * Who works here and when.
 *
 * Horarios used to be its own sidebar entry, two rows away — so setting up a
 * new professional meant creating them on one screen and then hunting for
 * another to give them an agenda. They are the same job, and a professional
 * without hours cannot take a single booking.
 */
function EquipoTabs() {
  const searchParams = useSearchParams();
  const requested = searchParams.get("tab");
  const active = TABS.some((tab) => tab.id === requested) ? requested! : TABS[0].id;

  return (
    <>
      <PanelHeader
        title="Equipo y horarios"
        subtitle="Tus profesionales, las horas en que atienden y quién entra al panel"
      />
      <PanelTabs tabs={TABS} active={active} />

      {active === "profesionales" && <StaffManager />}
      {active === "horarios" && <ScheduleEditor />}
      {active === "acceso" && (
        <PermissionGate
          permission="team:read"
          fallback={
            <div className="glass rounded-xl p-8 text-center text-sm text-muted-foreground">
              No tenés permisos para ver esta sección.
            </div>
          }
        >
          <TeamManager />
        </PermissionGate>
      )}
    </>
  );
}

export default function EquipoPage() {
  return (
    <Suspense fallback={null}>
      <EquipoTabs />
    </Suspense>
  );
}
