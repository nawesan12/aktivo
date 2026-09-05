"use client";

import Link from "next/link";
import {
  CalendarPlus,
  CreditCard,
  Globe,
  Scissors,
  Star,
  Users,
  type LucideIcon,
} from "lucide-react";

/**
 * Lo que se hace desde el panel, dicho con todas las letras.
 *
 * La barra de la izquierda nombra las quince pantallas —"Servicios", "Equipo y
 * horarios", "Pagos"— y quien nunca usó la aplicación no sabe cuál abrir para
 * lo que quiere hacer. Acá cada tarjeta dice la tarea, no la sección: "Cobrar
 * una seña" en vez de "Pagos".
 *
 * Sin consultas: son links. Lo único que se paga es el HTML que ya se estaba
 * mandando.
 */
interface Accion {
  titulo: string;
  detalle: string;
  href: string;
  icon: LucideIcon;
}

const ACCIONES: Accion[] = [
  {
    titulo: "Cargar un turno",
    detalle: "Alguien llamó o vino al mostrador",
    href: "/panel/turnos?nuevo=1",
    icon: CalendarPlus,
  },
  {
    titulo: "Editar mi web",
    detalle: "Fotos, colores, dirección y contacto",
    href: "/panel/mi-web",
    icon: Globe,
  },
  {
    titulo: "Mis servicios",
    detalle: "Qué hacés, cuánto dura y cuánto sale",
    href: "/panel/servicios",
    icon: Scissors,
  },
  {
    titulo: "Equipo y horarios",
    detalle: "Quién atiende y a qué hora abrís",
    href: "/panel/equipo",
    icon: Users,
  },
  {
    titulo: "Cobrar una seña",
    detalle: "Conectá Mercado Pago y cobrá al reservar",
    href: "/panel/pagos",
    icon: CreditCard,
  },
  {
    titulo: "Pedir reseñas",
    detalle: "Las estrellas que ven tus clientes nuevos",
    href: "/panel/reviews",
    icon: Star,
  },
];

export function QuickActions() {
  return (
    <section className="mb-[22px]">
      <h2 className="mb-3 text-[10px] font-bold uppercase tracking-[0.1em] text-faint">
        Qué querés hacer
      </h2>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {ACCIONES.map((accion) => (
          <Link
            key={accion.href}
            href={accion.href}
            className="group flex items-start gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-jade-fill text-jade-label transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <accion.icon className="size-4" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block text-[13px] font-bold">{accion.titulo}</span>
              <span className="mt-0.5 block text-[11.5px] leading-[1.45] text-muted-foreground">
                {accion.detalle}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
