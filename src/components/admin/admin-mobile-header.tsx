"use client";

import { Menu } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { AdminMobileNav } from "./admin-mobile-nav";

export function AdminMobileHeader() {
  const setAdminMobileNavOpen = useUIStore((s) => s.setAdminMobileNavOpen);

  return (
    <>
      <button
        onClick={() => setAdminMobileNavOpen(true)}
        className="p-2 rounded-md hover:bg-accent text-muted-foreground"
        aria-label="Abrir menú"
      >
        <Menu className="w-5 h-5" />
      </button>
      <AdminMobileNav />
    </>
  );
}
