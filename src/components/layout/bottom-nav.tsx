"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { MOBILE_NAV, isNavItemActive } from "./navigation";
import { haptic } from "@/lib/haptics";
import { PanelMenuTrigger } from "./panel-menu";

/**
 * The panel on a phone.
 *
 * What was here before was a hamburger opening a left drawer with all
 * twenty-four panel entries — a desktop menu shrunk down. The four screens an
 * owner actually opens between clients are one tap away now, and the fifth slot
 * is the thing they came to do: load a walk-in.
 */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegación principal"
      className="safe-bottom safe-x fixed inset-x-0 bottom-0 z-40 flex items-end justify-around border-t border-border bg-background/95 pt-[9px] backdrop-blur-xl [--safe-bottom:16px] [--safe-x:8px] lg:hidden"
    >
      {MOBILE_NAV.map((entry, index) => {
        if (entry === "action") {
          return (
            <Link
              key="action"
              href="/panel/turnos?nuevo=1"
              aria-label="Cargar un turno"
              onClick={() => haptic()}
              /*
                -24px of margin lifts the button half out of the bar, which is
                what makes it read as the primary action rather than a fifth tab.
              */
              className="-mt-6 flex size-[50px] items-center justify-center rounded-full bg-primary text-primary-foreground shadow-cta transition-colors hover:bg-[#22c55e]"
            >
              <Plus className="size-6" strokeWidth={2.5} />
            </Link>
          );
        }

        if (entry === "menu") {
          /*
            El menú, en el lugar que queda bajo el pulgar.

            Estaba sólo arriba a la izquierda, que en un teléfono grande es la
            esquina a la que no se llega sin cambiar la mano de posición — y
            detrás de esa hamburguesa estaban diez de las quince pantallas.
          */
          return (
            <PanelMenuTrigger
              key="menu"
              className="flex flex-col items-center gap-0.5 px-2 text-center text-faint transition-colors"
            >
              <Menu className="size-[17px]" aria-hidden />
              <span className="text-[8.5px]">Menú</span>
            </PanelMenuTrigger>
          );
        }

        const active = isNavItemActive(entry, pathname);
        const Icon = entry.icon;

        return (
          <Link
            key={index}
            href={entry.href}
            onClick={() => haptic()}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-col items-center gap-0.5 px-2 text-center transition-colors",
              active ? "text-jade-label" : "text-faint"
            )}
          >
            <Icon className="size-[17px]" aria-hidden />
            <span className={cn("text-[8.5px]", active && "font-semibold")}>{entry.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
