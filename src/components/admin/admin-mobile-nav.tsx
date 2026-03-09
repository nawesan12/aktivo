"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield,
  LayoutDashboard,
  Building2,
  Users,
  Settings,
  ArrowLeft,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import { Sheet, SheetContent } from "@/components/ui/sheet";

const adminNav = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Negocios", href: "/admin/negocios", icon: Building2 },
  { name: "Usuarios", href: "/admin/usuarios", icon: Users },
  { name: "Sistema", href: "/admin/sistema", icon: Settings },
];

export function AdminMobileNav() {
  const pathname = usePathname();
  const { adminMobileNavOpen, setAdminMobileNavOpen } = useUIStore();

  return (
    <Sheet open={adminMobileNavOpen} onOpenChange={setAdminMobileNavOpen}>
      <SheetContent side="left" className="w-72 p-0 bg-[#0a0a0d] border-sidebar-border">
        {/* Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <span className="font-heading text-lg font-bold">Jiku Admin</span>
          </div>
          <button
            onClick={() => setAdminMobileNavOpen(false)}
            className="p-1.5 rounded-md hover:bg-sidebar-accent text-muted-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-1">
          {adminNav.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setAdminMobileNavOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <item.icon className={cn("w-5 h-5 shrink-0", isActive && "text-primary")} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-sidebar-border">
          <Link
            href="/panel"
            onClick={() => setAdminMobileNavOpen(false)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Ir al panel
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}
