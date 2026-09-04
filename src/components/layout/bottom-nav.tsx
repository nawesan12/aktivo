"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { MOBILE_NAV, isNavItemActive } from "./navigation";

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
      className="safe-bottom safe-x fixed inset-x-0 bottom-0 z-40 flex items-end justify-around border-t border-border bg-background/95 px-2 pb-[13px] pt-[9px] backdrop-blur-xl lg:hidden"
    >
      {MOBILE_NAV.map((entry, index) => {
        if (entry === "action") {
          return (
            <Link
              key="action"
              href="/panel/turnos?nuevo=1"
              aria-label="Cargar un turno"
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

        const active = isNavItemActive(entry, pathname);
        const Icon = entry.icon;

        return (
          <Link
            key={index}
            href={entry.href}
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
