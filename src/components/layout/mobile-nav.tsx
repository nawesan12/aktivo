"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { JikuLogo } from "@/components/brand/jiku-logo";
import { cn } from "@/lib/utils";
import { PANEL_NAVIGATION as navigation } from "./navigation";
import { useUIStore } from "@/stores/ui-store";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { InstallPWAButton } from "@/components/dashboard/install-pwa-button";


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
        </div>

        {/* Navigation */}
        <nav className="space-y-1 p-3 flex-1 overflow-y-auto">
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
        <div className="px-3 pb-4 shrink-0">
          <InstallPWAButton />
        </div>
      </SheetContent>
    </Sheet>
  );
}
