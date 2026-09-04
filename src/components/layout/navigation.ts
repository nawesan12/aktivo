import {
  BadgeCheck,
  BarChart2,
  Calendar,
  CalendarDays,
  CreditCard,
  Gift,
  Globe,
  Hourglass,
  LayoutDashboard,
  Scissors,
  Settings,
  Sparkles,
  Star,
  UserCircle,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface PanelNavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  /**
   * Screens this entry owns without appearing separately in the sidebar —
   * either a tab of the destination or a page reached from inside it. They stay
   * listed so the active state survives the jump and so PANEL_ROUTES keeps
   * covering them.
   */
  covers?: string[];
  /** Live counters the sidebar fills in. */
  badge?: "waitlist" | "trial";
}

/**
 * One flat list, grouped only by the hairlines between blocks.
 *
 * It used to be five titled sections and twenty-four entries, which did not fit
 * a 900px viewport without scrolling — so the two screens at the bottom
 * ("Configuración", "Suscripción") were the ones nobody found. The redesign
 * trades section headings for 1px rules and folds the pairs that were always
 * visited together:
 *
 *   Equipo + Horarios        → tabs of /panel/equipo
 *   Membresías + Cupones     → tabs of /panel/membresias
 *   Etiquetas                → inside Clientes
 *   Sucursales, Envíos,
 *   Historial                → inside Configuración
 *   Mi perfil, Mis turnos,
 *   Mis avisos               → the user menu, where account settings belong
 */
export const PANEL_NAV_GROUPS: PanelNavItem[][] = [
  [
    { name: "Dashboard", href: "/panel", icon: LayoutDashboard },
    { name: "Turnos", href: "/panel/turnos", icon: Calendar },
    { name: "Calendario", href: "/panel/calendario", icon: CalendarDays },
    { name: "Lista de espera", href: "/panel/lista-espera", icon: Hourglass, badge: "waitlist" },
    { name: "Clientes", href: "/panel/clientes", icon: UserCircle, covers: ["/panel/etiquetas"] },
  ],
  [
    { name: "Mi web", href: "/panel/mi-web", icon: Globe },
    { name: "Servicios", href: "/panel/servicios", icon: Scissors },
    { name: "Equipo y horarios", href: "/panel/equipo", icon: Users, covers: ["/panel/horarios"] },
  ],
  [
    { name: "Pagos", href: "/panel/pagos", icon: CreditCard },
    {
      name: "Membresías y cupones",
      href: "/panel/membresias",
      icon: BadgeCheck,
      covers: ["/panel/cupones"],
    },
  ],
  [
    { name: "Reseñas", href: "/panel/reviews", icon: Star },
    { name: "Referidos", href: "/panel/referidos", icon: Gift },
    { name: "Reportes", href: "/panel/reportes", icon: BarChart2 },
  ],
  [
    {
      name: "Configuración",
      href: "/panel/configuracion",
      icon: Settings,
      covers: ["/panel/sucursales", "/panel/notificaciones", "/panel/audit"],
    },
    { name: "Suscripción", href: "/panel/suscripcion", icon: Sparkles, badge: "trial" },
  ],
];

/** The same entries, flat, for anything that only needs the sidebar's list. */
export const PANEL_NAVIGATION = PANEL_NAV_GROUPS.flat();

/**
 * Every panel screen that can be reached, including the ones folded into
 * another entry. `e2e/f18-panel-responsive.spec.ts` walks this to check no page
 * overflows horizontally on a phone — driving it off the sidebar alone would
 * quietly stop covering everything the merges hid.
 */
export const PANEL_ROUTES: string[] = [
  ...PANEL_NAVIGATION.map((item) => item.href),
  ...PANEL_NAVIGATION.flatMap((item) => item.covers ?? []),
  "/mi-cuenta/perfil",
  "/mi-cuenta/seguridad",
  "/mi-cuenta/turnos",
  "/mi-cuenta/notificaciones",
  "/mi-cuenta/referidos",
  "/mi-cuenta/negocios",
];

/**
 * The phone's bottom bar. Five slots, and the middle one is the "+" button
 * rather than a destination — so it is described here as a hole the component
 * fills, not as a route.
 */
export const MOBILE_NAV: (PanelNavItem | "action")[] = [
  { name: "Hoy", href: "/panel", icon: LayoutDashboard },
  { name: "Calendario", href: "/panel/calendario", icon: CalendarDays },
  "action",
  { name: "Clientes", href: "/panel/clientes", icon: UserCircle },
  // Settings has its own slot on purpose: on a phone it is the screen owners
  // reach for most after the agenda, and burying it behind a drawer was why
  // nobody changed their deposit percentage from the shop floor.
  { name: "Ajustes", href: "/panel/configuracion", icon: Settings },
];

/** Whether `pathname` is inside the screen this entry owns. */
export function isNavItemActive(item: PanelNavItem, pathname: string): boolean {
  const owns = [item.href, ...(item.covers ?? [])];
  return owns.some(
    (href) => pathname === href || (href !== "/panel" && pathname.startsWith(`${href}/`))
  );
}
