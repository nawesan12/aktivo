import {
  LayoutDashboard,
  Calendar,
  CalendarDays,
  Scissors,
  Users,
  UserCircle,
  Clock,
  BadgeCheck,
  CalendarCheck,
  Globe,
  UserCog,
  CreditCard,
  Bell,
  Settings,
  Shield,
  BarChart2,
  Star,
  Megaphone,
  MapPin,
  Activity,
  Send,
  Sparkles,
  Code2,
  Hourglass,
  Ticket,
  Gift,
  Tags,
  type LucideIcon,
} from "lucide-react";

/**
 * The panel's sections, in one place.
 *
 * The sidebar and the mobile menu each used to carry their own copy, and they
 * drifted: the phone was missing six sections, `Suscripción` among them. That
 * meant a business whose trial had run out — panel read-only, banner telling
 * them to subscribe — had no way of reaching the payment screen from a phone,
 * which is where most of them are.
 */
/**
 * The panel, in groups.
 *
 * It was twenty-four entries in one flat column: somebody opening it for the
 * first time had to read the whole list to find anything. And everything about
 * their own account lived in a different shell with a different header,
 * reachable only from a dropdown — so "mi cuenta" and "mi negocio" read as two
 * separate applications.
 */
export const PANEL_SECTIONS: {
  title: string;
  items: { name: string; href: string; icon: LucideIcon }[];
}[] = [
  {
    title: "Día a día",
    items: [
      { name: "Dashboard", href: "/panel", icon: LayoutDashboard },
      { name: "Turnos", href: "/panel/turnos", icon: Calendar },
      { name: "Calendario", href: "/panel/calendario", icon: CalendarDays },
      { name: "Lista de espera", href: "/panel/lista-espera", icon: Hourglass },
      { name: "Clientes", href: "/panel/clientes", icon: UserCircle },
    ],
  },
  {
    title: "Tu local",
    items: [
      { name: "Mi web", href: "/panel/mi-web", icon: Globe },
      { name: "Servicios", href: "/panel/servicios", icon: Scissors },
      { name: "Equipo", href: "/panel/equipo", icon: Users },
      { name: "Horarios", href: "/panel/horarios", icon: Clock },
      { name: "Etiquetas", href: "/panel/etiquetas", icon: Tags },
      { name: "Sucursales", href: "/panel/sucursales", icon: MapPin },
    ],
  },
  {
    title: "Plata",
    items: [
      { name: "Pagos", href: "/panel/pagos", icon: CreditCard },
      { name: "Membresías", href: "/panel/membresias", icon: BadgeCheck },
      { name: "Cupones", href: "/panel/cupones", icon: Ticket },
    ],
  },
  {
    title: "Crecer",
    items: [
      { name: "Reseñas", href: "/panel/reviews", icon: Star },
      { name: "Campañas", href: "/panel/campanas", icon: Megaphone },
      { name: "Referidos", href: "/panel/referidos", icon: Gift },
      { name: "Analytics", href: "/panel/analytics", icon: Activity },
      { name: "Reportes", href: "/panel/reportes", icon: BarChart2 },
      { name: "Widget", href: "/panel/widget", icon: Code2 },
      { name: "Envíos", href: "/panel/notificaciones", icon: Send },
    ],
  },
  {
    title: "Tu cuenta",
    items: [
      { name: "Mi perfil", href: "/mi-cuenta/perfil", icon: UserCog },
      { name: "Mis turnos", href: "/mi-cuenta/turnos", icon: CalendarCheck },
      { name: "Suscripción", href: "/panel/suscripcion", icon: Sparkles },
      { name: "Mis avisos", href: "/mi-cuenta/notificaciones", icon: Bell },
      { name: "Configuración", href: "/panel/configuracion", icon: Settings },
      { name: "Historial", href: "/panel/audit", icon: Shield },
    ],
  },
];

/** The same entries, flat, for anything that only needs the list of screens. */
export const PANEL_NAVIGATION = PANEL_SECTIONS.flatMap((section) => section.items);
