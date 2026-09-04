"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";
import { SETTINGS_SECTIONS, type SettingsSection } from "./settings-sections";


/**
 * Configuración's own left nav.
 *
 * The compact sidebar has fifteen entries and settings is one of them, so
 * everything that used to be its own row and was opened once a year —
 * sucursales, el historial de auditoría, el log de envíos — lives in here now
 * instead of competing with the screens a shop uses daily.
 */
export function SettingsNav({ active }: { active: SettingsSection }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <nav className="flex gap-1 overflow-x-auto text-[12.5px] lg:flex-col lg:overflow-visible">
      {SETTINGS_SECTIONS.map((section) => (
        <button
          key={section.id}
          type="button"
          aria-current={active === section.id ? "page" : undefined}
          onClick={() => {
            const next = new URLSearchParams(searchParams);
            if (section.id === "negocio") next.delete("s");
            else next.set("s", section.id);
            const query = next.toString();
            router.replace(query ? `?${query}` : "?", { scroll: false });
          }}
          className={cn(
            "whitespace-nowrap rounded-lg px-3 py-2.5 text-left transition-colors",
            active === section.id
              ? "bg-jade-fill font-semibold text-jade-label"
              : "text-muted-foreground hover:bg-muted"
          )}
        >
          {section.label}
        </button>
      ))}
    </nav>
  );
}
