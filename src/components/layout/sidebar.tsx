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
  ChevronLeft,
  BarChart2,
  Star,
  Megaphone,
  MapPin,
  Activity,
  Sparkles,
  Code2,
} from "lucide-react";
import { JikuLogo } from "@/components/brand/jiku-logo";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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
  { name: "Reseñas", href: "/panel/reviews", icon: Star },
  { name: "Campañas", href: "/panel/campanas", icon: Megaphone },
  { name: "Sucursales", href: "/panel/sucursales", icon: MapPin },
  { name: "Analytics", href: "/panel/analytics", icon: Activity },
  { name: "Reportes", href: "/panel/reportes", icon: BarChart2 },
  { name: "Widget", href: "/panel/widget", icon: Code2 },
  { name: "Suscripción", href: "/panel/suscripcion", icon: Sparkles },
  { name: "Configuración", href: "/panel/configuracion", icon: Settings },
  { name: "Audit Log", href: "/panel/audit", icon: Shield },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebarCollapsed } = useUIStore();

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300",
        sidebarCollapsed ? "w-[68px]" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
        {!sidebarCollapsed && (
          <Link href="/panel" className="flex items-center gap-2">
            <JikuLogo size="sm" />
          </Link>
        )}
        {sidebarCollapsed && (
          <div className="mx-auto">
            <JikuLogo size="sm" iconOnly />
          </div>
        )}
        <button
          onClick={toggleSidebarCollapsed}
          className={cn(
            "p-1.5 rounded-md hover:bg-sidebar-accent text-muted-foreground transition-colors",
            sidebarCollapsed && "hidden"
          )}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-1 px-2">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/panel" && pathname.startsWith(item.href));

            const link = (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground",
                  sidebarCollapsed && "justify-center px-2"
                )}
              >
                <item.icon className={cn("w-5 h-5 shrink-0", isActive && "text-primary")} />
                {!sidebarCollapsed && <span>{item.name}</span>}
                {isActive && !sidebarCollapsed && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </Link>
            );

            if (sidebarCollapsed) {
              return (
                <Tooltip key={item.name} delayDuration={0}>
                  <TooltipTrigger asChild>{link}</TooltipTrigger>
                  <TooltipContent side="right">{item.name}</TooltipContent>
                </Tooltip>
              );
            }

            return link;
          })}
        </nav>
      </ScrollArea>

      {/* Expand button */}
      {sidebarCollapsed && (
        <div className="p-2 border-t border-sidebar-border">
          <button
            onClick={toggleSidebarCollapsed}
            className="w-full p-2 rounded-md hover:bg-sidebar-accent text-muted-foreground transition-colors flex items-center justify-center"
          >
            <ChevronLeft className="w-4 h-4 rotate-180" />
          </button>
        </div>
      )}
    </aside>
  );
}
