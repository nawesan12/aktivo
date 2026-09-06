"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { JikuLogo } from "@/components/brand/jiku-logo";
import { PANEL_NAV_GROUPS, isNavItemActive } from "./navigation";
import { cn } from "@/lib/utils";
import { haptic } from "@/lib/haptics";

/**
 * Everything the bottom bar does not have room for.
 *
 * The bar holds the five things an owner touches between clients, which is the
 * right bar and the wrong whole story: the other ten screens had no way in on a
 * phone at all. This is that way in.
 *
 * Un solo panel con dos disparadores: el de la barra de arriba y el último
 * lugar de la de abajo, que es el que queda bajo el pulgar. Montar el `Sheet`
 * dos veces daría dos paneles superpuestos, así que el estado vive en el
 * proveedor —que envuelve al layout entero— y los botones lo piden por
 * contexto.
 */
const MenuContext = createContext<(() => void) | null>(null);

export function PanelMenuTrigger({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const abrir = useContext(MenuContext);
  return (
    <button
      type="button"
      aria-label="Abrir el menú"
      onClick={() => {
        haptic();
        abrir?.();
      }}
      className={className}
    >
      {children}
    </button>
  );
}

/** El botón de la barra de arriba, con su estilo propio. */
export function PanelMenu() {
  return (
    <PanelMenuTrigger className="flex size-[34px] items-center justify-center rounded-[10px] border border-border bg-card text-muted-foreground transition-colors hover:bg-accent lg:hidden">
      <Menu className="size-[15px]" aria-hidden />
    </PanelMenuTrigger>
  );
}

export function PanelMenuProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <MenuContext.Provider value={() => setOpen(true)}>
      {children}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="sidebar-surface w-[260px] border-0 p-0">
          <SheetHeader className="px-4 pb-3 pt-4">
            <SheetTitle className="flex items-center gap-2">
              <JikuLogo size="sm" tone="jade" />
              <span className="ml-auto font-serif text-[14px] text-primary/40" aria-hidden>
                軸
              </span>
            </SheetTitle>
          </SheetHeader>

          <nav className="safe-bottom flex flex-col overflow-y-auto px-[10px] text-[13px] [--safe-bottom:16px]">
            {PANEL_NAV_GROUPS.map((group, index) => (
              <div key={index} className="contents">
                {index > 0 && (
                  <div className="mx-[10px] my-2 h-px bg-sidebar-border" role="separator" />
                )}
                {group.map((item) => {
                  const active = isNavItemActive(item, pathname);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => {
                        haptic();
                        setOpen(false);
                      }}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors",
                        active
                          ? "bg-jade-fill font-semibold text-primary"
                          : "text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      )}
                    >
                      <Icon className="size-4 shrink-0" aria-hidden />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    </MenuContext.Provider>
  );
}
