"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const TABS = [
  { name: "Perfil", href: "/mi-cuenta/perfil" },
  { name: "Seguridad", href: "/mi-cuenta/seguridad" },
  { name: "Mis turnos", href: "/mi-cuenta/turnos" },
  { name: "Notificaciones", href: "/mi-cuenta/notificaciones" },
  { name: "Referidos", href: "/mi-cuenta/referidos" },
  { name: "Negocios", href: "/mi-cuenta/negocios" },
];

/**
 * The account's own tab row.
 *
 * Split out of the layout so it can read the pathname: as a server component
 * every tab rendered with `border-transparent`, so the row never showed which
 * page you were on.
 */
export function AccountTabs() {
  const pathname = usePathname();

  return (
    <nav className="mx-auto flex max-w-4xl gap-1 overflow-x-auto px-4">
      {TABS.map((tab) => {
        const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
              active
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
            )}
          >
            {tab.name}
          </Link>
        );
      })}
    </nav>
  );
}
