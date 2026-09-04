"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { JikuLogo } from "@/components/brand/jiku-logo";
import { cn } from "@/lib/utils";
import { PANEL_SECTIONS } from "./navigation";
import { useUIStore } from "@/stores/ui-store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { InstallPWAButton } from "@/components/dashboard/install-pwa-button";


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
          aria-label="Contraer el menú lateral"
          aria-expanded={!sidebarCollapsed}
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
        <nav className="px-2">
          {PANEL_SECTIONS.map((section) => (
            <div key={section.title} className="mb-4 last:mb-0">
              {/* The heading disappears when the rail is collapsed to icons,
                  where there is no room for it and the grouping is carried by
                  the gaps instead. */}
              {!sidebarCollapsed && (
                <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  {section.title}
                </p>
              )}
              <div className="space-y-1">
          {section.items.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/panel" && pathname.startsWith(item.href));

            const link = (
              <Link
                key={item.name}
                href={item.href}
                // The colour alone says "you are here" to people who can see it.
                aria-current={isActive ? "page" : undefined}
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
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* Install PWA */}
      <div className="px-2 pb-2">
        <InstallPWAButton collapsed={sidebarCollapsed} />
      </div>

      {/* Expand button */}
      {sidebarCollapsed && (
        <div className="p-2 border-t border-sidebar-border">
          <button
            onClick={toggleSidebarCollapsed}
            aria-label="Expandir el menú lateral"
            aria-expanded={!sidebarCollapsed}
            className="w-full p-2 rounded-md hover:bg-sidebar-accent text-muted-foreground transition-colors flex items-center justify-center"
          >
            <ChevronLeft className="w-4 h-4 rotate-180" />
          </button>
        </div>
      )}
    </aside>
  );
}
