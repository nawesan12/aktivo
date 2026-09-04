"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import useSWR from "swr";

import { JikuLogo } from "@/components/brand/jiku-logo";
import { cn } from "@/lib/utils";
import { PANEL_NAV_GROUPS, isNavItemActive, type PanelNavItem } from "./navigation";
import { LocationSwitcher } from "@/components/dashboard/location-switcher";

interface Access {
  trialDaysLeft: number;
  hasSubscription: boolean;
}

/**
 * The panel's spine: 212px, dark, one uninterrupted list.
 *
 * Dark on a light page is the point — it is the only thing that marks where the
 * chrome ends and the business's own data begins. The previous sidebar was 256px
 * with five section headings and twenty-four rows, which needed a scrollbar
 * below about 900px of viewport; the two entries that fell under the fold were
 * Configuración and Suscripción. This fits without scrolling, and the collapse
 * toggle went with it — there is nothing left to reclaim.
 */
export function Sidebar() {
  const pathname = usePathname();
  const { data: access } = useSWR<Access>("/api/panel/access");
  // status=pending is the only count worth a badge: entries already notified or
  // expired are not waiting on anyone.
  const { data: waitlist } = useSWR<{ total: number }>(
    "/api/panel/waitlist?status=pending&pageSize=1"
  );

  const counters = {
    waitlist: waitlist?.total ?? 0,
    trial: access && !access.hasSubscription ? access.trialDaysLeft : 0,
  };

  return (
    <aside className="sidebar-surface hidden w-[212px] shrink-0 flex-col lg:flex">
      <div className="flex items-center gap-2 px-4 pb-[13px] pt-[15px]">
        <Link href="/panel" aria-label="Ir al panel">
          <JikuLogo size="sm" tone="jade" />
        </Link>
        <span className="ml-auto font-serif text-[14px] text-primary/40" aria-hidden>
          軸
        </span>
      </div>

      <nav className="flex flex-1 flex-col px-[10px] pt-1 text-xs">
        {PANEL_NAV_GROUPS.map((group, index) => (
          <div key={index} className="contents">
            {index > 0 && (
              <div className="mx-[10px] my-[7px] h-px bg-sidebar-border" role="separator" />
            )}
            {group.map((item) => (
              <NavRow
                key={item.href}
                item={item}
                active={isNavItemActive(item, pathname)}
                counters={counters}
              />
            ))}
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border px-4 py-3">
        <LocationSwitcher />
      </div>
    </aside>
  );
}

function NavRow({
  item,
  active,
  counters,
}: {
  item: PanelNavItem;
  active: boolean;
  counters: { waitlist: number; trial: number };
}) {
  const count = item.badge ? counters[item.badge] : 0;

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center justify-between rounded-lg px-2.5 py-1.5 transition-colors",
        active
          ? "bg-jade-fill font-semibold text-primary"
          : "text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      )}
    >
      <span>{item.name}</span>
      {item.badge === "waitlist" && count > 0 && (
        <span className="rounded-full bg-warning/15 px-1.5 py-px text-[9px] font-bold text-warning">
          {count}
        </span>
      )}
      {item.badge === "trial" && count > 0 && (
        <span className="rounded-full bg-primary/15 px-[7px] py-px text-[8.5px] font-bold text-primary">
          {count === 1 ? "1 DÍA" : `${count} DÍAS`}
        </span>
      )}
    </Link>
  );
}
