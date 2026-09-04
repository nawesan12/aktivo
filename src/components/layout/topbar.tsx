"use client";

import { useState } from "react";
import { useSWRConfig } from "swr";
import { Moon, Plus, Sun } from "lucide-react";

import { CommandSearch } from "@/components/dashboard/command-search";
import { PanelMenu } from "@/components/layout/panel-menu";
import { NotificationBell } from "@/components/dashboard/notification-bell";
import { NewAppointmentDialog } from "@/components/dashboard/new-appointment-dialog";
import { UserMenu } from "@/components/layout/user-menu";
import { PermissionGate } from "@/components/auth/permission-gate";
import { useTheme } from "@/components/providers/theme-provider";

export function Topbar() {
  const { theme, toggleTheme } = useTheme();
  const { mutate } = useSWRConfig();
  const [newAppointment, setNewAppointment] = useState(false);

  return (
    <header className="safe-top safe-x flex items-center gap-3.5 border-b border-border bg-card pb-[18px] [--safe-top:18px] [--safe-x:16px] lg:pb-[13px] lg:[--safe-top:13px] lg:[--safe-x:28px]">
      {/* Only on a phone: on a desktop the sidebar already lists everything. */}
      <PanelMenu />
      <CommandSearch />

      <div className="ml-auto flex items-center gap-2.5">
        <NotificationBell />

        <button
          type="button"
          aria-label={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
          onClick={toggleTheme}
          className="flex size-[34px] items-center justify-center rounded-[10px] border border-border bg-card text-muted-foreground transition-colors hover:bg-accent"
        >
          {theme === "dark" ? <Sun className="size-[15px]" /> : <Moon className="size-[15px]" />}
        </button>

        <UserMenu
          links={[
            { label: "Mi perfil", href: "/mi-cuenta/perfil" },
            { label: "Mis turnos", href: "/mi-cuenta/turnos" },
            { label: "Mis avisos", href: "/mi-cuenta/notificaciones" },
            { label: "Seguridad", href: "/mi-cuenta/seguridad" },
            { label: "Configuración", href: "/panel/configuracion" },
          ]}
        />

        {/*
          The one place this lives now. It used to be duplicated on the dashboard
          and above the appointments table, which meant two buttons with the same
          name on /panel/turnos and no trigger at all on any other screen — an
          owner on the calendar had to navigate away to take a phone booking.
        */}
        <PermissionGate permission="appointments:create">
          <button
            type="button"
            onClick={() => setNewAppointment(true)}
            className="hidden items-center gap-1.5 rounded-[10px] bg-primary px-4 py-[9px] text-[12.5px] font-bold text-primary-foreground transition-colors hover:bg-[#22c55e] sm:inline-flex"
          >
            <Plus className="size-3.5" strokeWidth={3} />
            Cargar un turno
          </button>
        </PermissionGate>
      </div>

      <NewAppointmentDialog
        open={newAppointment}
        onClose={() => setNewAppointment(false)}
        onCreated={() =>
          mutate(
            (key) =>
              typeof key === "string" &&
              (key.startsWith("/api/panel/appointments") || key.startsWith("/api/panel/stats")),
            undefined,
            { revalidate: true }
          )
        }
      />
    </header>
  );
}
