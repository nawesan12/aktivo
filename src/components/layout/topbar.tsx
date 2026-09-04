"use client";

import { Menu, Moon, Sun } from "lucide-react";
import { CommandSearch } from "@/components/dashboard/command-search";
import { LocationSwitcher } from "@/components/dashboard/location-switcher";
import { NotificationBell } from "@/components/dashboard/notification-bell";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/layout/user-menu";
import { useUIStore } from "@/stores/ui-store";
import { useTheme } from "@/components/providers/theme-provider";

export function Topbar() {
  const { setMobileNavOpen } = useUIStore();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="h-16 border-b border-border bg-background/80 backdrop-blur-xl flex items-center justify-between px-4 lg:px-6">
      {/* Left */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label="Abrir el menú"
          onClick={() => setMobileNavOpen(true)}
        >
          <Menu className="w-5 h-5" />
        </Button>

        <CommandSearch />

        {/*
          Switching branches. The component was finished and never mounted
          anywhere, so multi-location — the feature the top plan is sold on —
          could be bought and not used: every business card in the account
          linked to the same panel, and the active branch was whichever came
          first alphabetically. It hides itself when there is no group.
        */}
        <LocationSwitcher />
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          aria-label={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
          onClick={toggleTheme}
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </Button>

        <NotificationBell />

        <UserMenu
          links={[
            { label: "Mi cuenta", href: "/mi-cuenta" },
            { label: "Configuración", href: "/panel/configuracion" },
          ]}
        />
      </div>
    </header>
  );
}
