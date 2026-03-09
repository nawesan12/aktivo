"use client";

import { useState } from "react";
import useSWR from "swr";
import { MapPin, ChevronDown, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";


export function LocationSwitcher() {
  const { data } = useSWR("/api/panel/group");
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  if (!data?.group) return null;

  const group = data.group;
  const locations = group.businesses || [];

  if (locations.length <= 1) return null;

  async function switchBusiness(businessId: string) {
    setSwitching(true);
    try {
      const res = await fetch("/api/panel/switch-business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId }),
      });

      if (!res.ok) throw new Error((await res.json()).error);

      // Reload to apply new session
      toast.success("Sucursal cambiada");
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al cambiar");
    } finally {
      setSwitching(false);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={switching}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:bg-accent text-sm transition-colors"
      >
        {switching ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <MapPin className="w-4 h-4 text-primary" />
        )}
        <span className="max-w-[120px] truncate">{group.name}</span>
        <ChevronDown className="w-3 h-3 text-muted-foreground" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 bg-popover border border-border rounded-xl shadow-lg min-w-[200px] py-1">
            <p className="px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Sucursales
            </p>
            {locations.map((loc: { id: string; name: string; slug: string }) => (
              <button
                key={loc.id}
                onClick={() => { switchBusiness(loc.id); setOpen(false); }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent text-left transition-colors"
              >
                <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="flex-1 truncate">{loc.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
