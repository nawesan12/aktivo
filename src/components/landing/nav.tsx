"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { JikuLogo } from "@/components/brand/jiku-logo";

const SECTIONS = [
  { href: "#features", label: "Funciones" },
  { href: "#pricing", label: "Planes" },
  { href: "#testimonials", label: "Reseñas" },
];

/**
 * The only interactive part of the landing: the mobile menu and the class the
 * bar picks up once the page is scrolled.
 *
 * The in-page links are plain anchors now. They used to run a handler calling
 * `scrollIntoView({ behavior: "smooth" })`, which `scroll-behavior: smooth` in
 * CSS already does — and doing it in JavaScript also broke the URL fragment, so
 * a section could not be linked to or shared.
 */
export function Nav() {
  const navRef = useRef<HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      navRef.current?.classList.toggle("scrolled", window.scrollY > 60);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // A menu that stays open behind a navigation is a menu the user has to close.
  const close = () => setMobileOpen(false);

  return (
    <>
      <nav ref={navRef} className="jiku-nav">
        <div className="nav-inner">
          <Link href="/" className="nav-logo">
            <JikuLogo size="md" />
          </Link>
          <div className="nav-links">
            {SECTIONS.map((section) => (
              <a key={section.href} href={section.href}>
                {section.label}
              </a>
            ))}
            <Link href="/iniciar-sesion" className="nav-link-login">
              Iniciar sesión
            </Link>
            <Link href="/registrarse" className="btn btn-jade">
              Empezar gratis →
            </Link>
          </div>
          <button
            className={`nav-hamburger ${mobileOpen ? "open" : ""}`}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={mobileOpen}
            aria-controls="landing-mobile-menu"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="nav-mobile-overlay" onClick={close}>
          <div
            id="landing-mobile-menu"
            className="nav-mobile-menu"
            onClick={(e) => e.stopPropagation()}
          >
            {SECTIONS.map((section) => (
              <a key={section.href} href={section.href} onClick={close}>
                {section.label}
              </a>
            ))}
            <Link href="/iniciar-sesion" onClick={close}>
              Iniciar sesión
            </Link>
            <Link href="/registrarse" className="btn btn-jade" onClick={close}>
              Empezar gratis →
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
