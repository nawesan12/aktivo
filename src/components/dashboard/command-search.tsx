"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import {
  Calendar,
  Users,
  Scissors,
  User,
  Settings,
  BarChart2,
  CreditCard,
  Search,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";


const typeIcons: Record<string, typeof Calendar> = {
  appointment: Calendar,
  client: User,
  service: Scissors,
  staff: Users,
};

const shortcuts = [
  { label: "Turnos", href: "/panel/turnos", icon: Calendar },
  { label: "Servicios", href: "/panel/servicios", icon: Scissors },
  { label: "Equipo", href: "/panel/equipo", icon: Users },
  { label: "Clientes", href: "/panel/clientes", icon: User },
  { label: "Reportes", href: "/panel/reportes", icon: BarChart2 },
  { label: "Pagos", href: "/panel/pagos", icon: CreditCard },
  { label: "Configuración", href: "/panel/configuracion", icon: Settings },
];

export function CommandSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data } = useSWR(
    debouncedQuery.length >= 2 ? `/api/panel/search?q=${encodeURIComponent(debouncedQuery)}` : null);

  // Global keyboard shortcut
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // ⌘K / Ctrl+K is what the button says, and it works from inside a field.
      // "/" stays as a second way in, but only when nothing is focused.
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(true);
        return;
      }
      if (e.key === "/" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        setOpen(true);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const handleSelect = useCallback(
    (href: string) => {
      setOpen(false);
      setQuery("");
      router.push(href);
    },
    [router]
  );

  const results = data?.results || [];

  // Group results by type
  const appointments = results.filter((r: Record<string, string>) => r.type === "appointment");
  const clients = results.filter((r: Record<string, string>) => r.type === "client");
  const services = results.filter((r: Record<string, string>) => r.type === "service");
  const staff = results.filter((r: Record<string, string>) => r.type === "staff");

  return (
    <>
      {/* On a phone there was no way in at all: the bar is hidden below md and
          the "/" shortcut needs a keyboard, so the one search that reaches
          turnos, clientes and servicios at once did not exist on the device the
          owner actually has in their hand. */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Buscar"
        className="flex size-[34px] items-center justify-center rounded-[10px] border border-border bg-card text-muted-foreground transition-colors hover:bg-accent md:hidden"
      >
        <Search className="size-[15px]" />
      </button>

      <button
        onClick={() => setOpen(true)}
        className="hidden w-[300px] items-center gap-2.5 rounded-[10px] border border-border bg-background px-3.5 py-[9px] text-xs text-faint transition-colors hover:border-faint md:flex"
      >
        <Search className="size-3.5" />
        <span className="flex-1 text-left">Buscar</span>
        <kbd className="rounded-[5px] border border-border bg-card px-1.5 py-px font-mono text-[10px]">
          ⌘K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Buscar turnos, clientes, servicios..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>No se encontraron resultados.</CommandEmpty>

          {appointments.length > 0 && (
            <CommandGroup heading="Turnos">
              {appointments.map((r: Record<string, string>) => {
                const Icon = typeIcons[r.type] || Calendar;
                return (
                  <CommandItem key={r.id} onSelect={() => handleSelect(r.href)}>
                    <Icon className="w-4 h-4 mr-2 text-muted-foreground" />
                    <span>{r.label}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{r.sublabel}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}

          {clients.length > 0 && (
            <CommandGroup heading="Clientes">
              {clients.map((r: Record<string, string>) => (
                <CommandItem key={r.id} onSelect={() => handleSelect(r.href)}>
                  <User className="w-4 h-4 mr-2 text-muted-foreground" />
                  <span>{r.label}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{r.sublabel}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {services.length > 0 && (
            <CommandGroup heading="Servicios">
              {services.map((r: Record<string, string>) => (
                <CommandItem key={r.id} onSelect={() => handleSelect(r.href)}>
                  <Scissors className="w-4 h-4 mr-2 text-muted-foreground" />
                  <span>{r.label}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{r.sublabel}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {staff.length > 0 && (
            <CommandGroup heading="Staff">
              {staff.map((r: Record<string, string>) => (
                <CommandItem key={r.id} onSelect={() => handleSelect(r.href)}>
                  <Users className="w-4 h-4 mr-2 text-muted-foreground" />
                  <span>{r.label}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{r.sublabel}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          <CommandSeparator />

          <CommandGroup heading="Acciones rápidas">
            {shortcuts.map((s) => (
              <CommandItem key={s.href} onSelect={() => handleSelect(s.href)}>
                <s.icon className="w-4 h-4 mr-2 text-muted-foreground" />
                <span>{s.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
