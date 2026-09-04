import Link from "next/link";

import { JikuLogo } from "@/components/brand/jiku-logo";

/**
 * Three columns, not the mockup's four.
 *
 * The design's "Recursos" and "Empresa" columns list ten destinations — API,
 * Blog, Guías, Status, Nosotros, Términos — and none of them exist. They were
 * `href="#"` on the old footer, which is a link that lies; rendering them as
 * plain grey words instead would be a menu of things you cannot click. Every
 * entry here goes somewhere real.
 */
const COLUMNS = [
  {
    title: "Producto",
    links: [
      { label: "Funciones", href: "/#funciones" },
      { label: "Cómo funciona", href: "/#como-funciona" },
      { label: "Planes", href: "/#planes" },
    ],
  },
  {
    title: "Reservar",
    links: [
      { label: "Explorar negocios", href: "/explorar" },
      { label: "Mis turnos", href: "/mi-cuenta/turnos" },
    ],
  },
  {
    title: "Tu cuenta",
    links: [
      { label: "Crear una cuenta", href: "/registrarse" },
      { label: "Iniciar sesión", href: "/iniciar-sesion" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="safe-bottom border-t border-border-subtle bg-card px-[22px] pt-14 [--safe-bottom:28px] sm:px-10 lg:px-16 lg:pt-[52px]">
      <div className="mb-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] lg:gap-11">
        <div>
          <JikuLogo size="md" />
          <p className="mt-2.5 max-w-[240px] text-[12.5px] leading-[1.6] text-muted-foreground">
            El <span className="text-jade-link">eje</span> de tu negocio. Más que turnos,
            crecimiento.
          </p>
        </div>

        {COLUMNS.map((column) => (
          <div key={column.title}>
            <p className="mb-3 text-[10.5px] font-bold uppercase tracking-[0.12em] text-faint">
              {column.title}
            </p>
            <ul className="flex flex-col gap-2 text-[13px] text-muted-foreground">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition-colors hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 border-t border-border-subtle pt-5 text-xs text-faint sm:flex-row sm:justify-between">
        <span>© {new Date().getFullYear()} Jiku. Todos los derechos reservados.</span>
        <span className="font-serif text-[13px] italic">
          <span className="text-jade-link">軸</span> — El eje de tu negocio
        </span>
      </div>
    </footer>
  );
}
