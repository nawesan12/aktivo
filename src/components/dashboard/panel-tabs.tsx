"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";

/**
 * The tab row that holds a merged screen together.
 *
 * The redesign's sidebar is one compact list of fifteen entries, so pairs that
 * were always visited together — Equipo and Horarios, Membresías and Cupones —
 * became one entry each. The tab lives in the URL rather than in state so a
 * link, a refresh and the back button all land where they should.
 */
export function PanelTabs({
  tabs,
  active,
  param = "tab",
}: {
  tabs: { id: string; label: string }[];
  active: string;
  param?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <div className="mb-4 flex gap-1 border-b border-border">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          aria-current={active === tab.id ? "page" : undefined}
          onClick={() => {
            const next = new URLSearchParams(searchParams);
            if (tab.id === tabs[0].id) next.delete(param);
            else next.set(param, tab.id);
            const query = next.toString();
            router.replace(query ? `?${query}` : "?", { scroll: false });
          }}
          className={cn(
            "border-b-2 px-4 py-2.5 text-[13px] font-semibold transition-colors",
            active === tab.id
              ? "border-primary text-jade-label"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
