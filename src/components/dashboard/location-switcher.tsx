"use client";

import { useState } from "react";
import useSWR from "swr";
import { ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

interface BusinessSummary {
  id: string;
  name: string;
  slug: string;
  city?: string | null;
}

/**
 * The sidebar's foot: who you are working on right now.
 *
 * It used to live in the topbar and render nothing at all unless the account had
 * a group of branches — so most owners never saw which business the panel was
 * pointed at. Now the name is always there and the dropdown only appears when
 * there is somewhere else to go.
 */
export function LocationSwitcher() {
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  /*
    The name comes from the chrome's one request, not from `/api/panel/settings`
    — which reads the whole business row plus its settings so this could print
    two words. The list of branches is only asked for when the switcher is
    opened, and only by an account that has a group: most shops have one
    location and were paying for that round trip on every page.
  */
  const { data: access } = useSWR<{ business: BusinessSummary | null; hasGroup: boolean }>(
    "/api/panel/access"
  );
  const { data: groupData } = useSWR<{ group?: { name: string; businesses: BusinessSummary[] } }>(
    open && access?.hasGroup ? "/api/panel/group" : null
  );

  const business = access?.business ?? null;
  const locations = groupData?.group?.businesses ?? [];
  const canSwitch = Boolean(access?.hasGroup);

  async function switchBusiness(businessId: string) {
    setSwitching(true);
    try {
      const res = await fetch("/api/panel/switch-business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId }),
      });

      if (!res.ok) throw new Error((await res.json()).error);

      // A full reload, not a session update: every panel screen holds SWR data
      // scoped to the old business, and reloading is the only thing that clears
      // all of it at once. The id is re-checked server-side against the user's
      // memberships before the cookie is rewritten.
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al cambiar");
      setSwitching(false);
    }
  }

  if (!business) {
    return <div className="h-[34px] animate-pulse rounded-lg bg-white/5" aria-hidden />;
  }

  const initials = business.name
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => canSwitch && setOpen(!open)}
        disabled={switching || !canSwitch}
        aria-expanded={canSwitch ? open : undefined}
        className={cn(
          "flex w-full items-center gap-[9px] rounded-lg text-left transition-colors",
          canSwitch && "hover:bg-sidebar-accent"
        )}
      >
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-[9.5px] font-bold text-primary-foreground">
          {switching ? <Loader2 className="size-3 animate-spin" /> : initials}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[11px] font-semibold text-sidebar-foreground">
            {business.name}
          </span>
          <span className="flex items-center gap-0.5 text-[9px] text-sidebar-muted">
            <span className="truncate">{business.city ?? "Sucursal única"}</span>
            {canSwitch && <ChevronDown className="size-2.5 shrink-0" aria-hidden />}
          </span>
        </span>
      </button>

      {open && canSwitch && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full left-0 z-50 mb-2 w-full min-w-[190px] rounded-xl border border-border bg-popover py-1 shadow-card-lift">
            <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-faint">
              Sucursales
            </p>
            {locations.map((location) => (
              <button
                key={location.id}
                type="button"
                onClick={() => {
                  switchBusiness(location.id);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] transition-colors hover:bg-accent",
                  location.id === business.id && "font-semibold text-jade-label"
                )}
              >
                <span className="flex-1 truncate">{location.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
