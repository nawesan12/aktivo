"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";

import { JikuLogo } from "@/components/brand/jiku-logo";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { href: "#funciones", label: "Funciones" },
  { href: "#planes", label: "Planes" },
  { href: "#como-funciona", label: "Cómo funciona" },
];

export function Nav() {
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // The bar is translucent over the dotted page; once anything has scrolled
    // under it, it needs the extra blur and a hairline to stay legible.
    const onScroll = () => headerRef.current?.classList.toggle("shadow-card", window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      ref={headerRef}
      className="safe-top sticky top-0 z-50 border-b border-border-subtle bg-background/85 backdrop-blur-xl transition-shadow"
    >
      <div className="flex items-center justify-between px-[22px] py-3.5 sm:px-10 lg:px-16 lg:py-[18px]">
        <Link href="/" aria-label="Jiku">
          <JikuLogo size="md" withKanji />
        </Link>

        <nav className="hidden items-center gap-7 text-[13px] text-muted-foreground lg:flex">
          {SECTIONS.map((section) => (
            <a key={section.href} href={section.href} className="transition-colors hover:text-foreground">
              {section.label}
            </a>
          ))}
          {/*
            The landing sells the panel to shop owners, so both of these used to
            be about running one. Somebody who books here is a different person
            with a different errand, and until now the front door had nothing
            for them.
          */}
          <Link href="/explorar" className="transition-colors hover:text-foreground">
            Explorar
          </Link>
          <Link href="/mis-turnos" className="transition-colors hover:text-foreground">
            Mis turnos
          </Link>
          <Link href="/iniciar-sesion" className="transition-colors hover:text-foreground">
            Iniciar sesión
          </Link>
          <Link
            href="/registrarse"
            className="rounded-[10px] bg-primary px-[22px] py-2.5 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-[#22c55e]"
          >
            Empezar gratis
          </Link>
        </nav>

        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label={open ? "Cerrar el menú" : "Abrir el menú"}
          className="flex size-9 items-center justify-center rounded-[10px] border border-border lg:hidden"
        >
          {open ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>
      </div>

      <div
        className={cn(
          "overflow-hidden border-t border-border-subtle bg-background lg:hidden",
          open ? "block" : "hidden"
        )}
      >
        <nav className="flex flex-col gap-1 px-[22px] py-4 text-sm">
          {SECTIONS.map((section) => (
            <a
              key={section.href}
              href={section.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-2 py-2.5 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              {section.label}
            </a>
          ))}
          <Link
            href="/explorar"
            onClick={() => setOpen(false)}
            className="rounded-lg px-2 py-2.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            Explorar
          </Link>
          <Link
            href="/mis-turnos"
            onClick={() => setOpen(false)}
            className="rounded-lg px-2 py-2.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            Mis turnos
          </Link>
          <Link
            href="/iniciar-sesion"
            onClick={() => setOpen(false)}
            className="rounded-lg px-2 py-2.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/registrarse"
            onClick={() => setOpen(false)}
            className="mt-2 rounded-[10px] bg-primary px-4 py-3 text-center font-semibold text-primary-foreground"
          >
            Empezar gratis
          </Link>
        </nav>
      </div>
    </header>
  );
}
