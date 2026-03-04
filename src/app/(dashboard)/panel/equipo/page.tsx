"use client";

import { useState } from "react";
import { StaffManager } from "@/components/dashboard/staff-manager";
import { TeamManager } from "@/components/dashboard/team-manager";
import { PermissionGate } from "@/components/auth/permission-gate";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "staff", label: "Profesionales" },
  { id: "access", label: "Acceso al panel" },
];

export default function EquipoPage() {
  const [activeTab, setActiveTab] = useState("staff");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-heading font-bold">Equipo</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Administra tu equipo de profesionales y acceso al panel
        </p>
      </div>

      <div className="flex gap-1 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "staff" && <StaffManager />}
      {activeTab === "access" && (
        <PermissionGate permission="team:read" fallback={
          <div className="glass rounded-xl p-8 text-center text-sm text-muted-foreground">
            No tenes permisos para ver esta seccion
          </div>
        }>
          <TeamManager />
        </PermissionGate>
      )}
    </div>
  );
}
