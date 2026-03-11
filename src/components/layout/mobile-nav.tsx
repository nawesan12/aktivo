"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  CalendarDays,
  Scissors,
  Users,
  UserCircle,
  Clock,
  CreditCard,
  Bell,
  Settings,
  Shield,
  X,
  BarChart2,
  Code2,
} from "lucide-react";
import { JikuLogo } from "@/components/brand/jiku-logo";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { InstallPWAButton } from "@/components/dashboard/install-pwa-button";

const navigation = [
  { name: "Dashboard", href: "/panel", icon: LayoutDashboard },
  { name: "Turnos", href: "/panel/turnos", icon: Calendar },
  { name: "Calendario", href: "/panel/calendario", icon: CalendarDays },
  { name: "Servicios", href: "/panel/servicios", icon: Scissors },
  { name: "Equipo", href: "/panel/equipo", icon: Users },
  { name: "Clientes", href: "/panel/clientes", icon: UserCircle },
  { name: "Horarios", href: "/panel/horarios", icon: Clock },
  { name: "Pagos", href: "/panel/pagos", icon: CreditCard },
  { name: "Notificaciones", href: "/panel/notificaciones", icon: Bell },
  { name: "Reportes", href: "/panel/reportes", icon: BarChart2 },
  { name: "Widget", href: "/panel/widget", icon: Code2 },
  { name: "Configuración", href: "/panel/configuracion", icon: Settings },
  { name: "Audit Log", href: "/panel/audit", icon: Shield },
];

export function MobileNav() {
  const pathname = usePathname();
  const { mobileNavOpen, setMobileNavOpen } = useUIStore();

  return (
    <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
      <SheetContent side="left" className="w-72 p-0 bg-sidebar border-sidebar-border">
        {/* Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
          <Link
            href="/panel"
            className="flex items-center gap-2"
            onClick={() => setMobileNavOpen(false)}
          >
            <JikuLogo size="sm" />
          </Link>
          <button
            onClick={() => setMobileNavOpen(false)}
            className="p-1.5 rounded-md hover:bg-sidebar-accent text-muted-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="space-y-1 p-3">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/panel" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileNavOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive && "text-primary")} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Install PWA */}
        <div className="px-3 mt-4">
          <InstallPWAButton />
        </div>
      </SheetContent>
    </Sheet>
  );
}
