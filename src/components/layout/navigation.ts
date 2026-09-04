import {
  LayoutDashboard,
  Calendar,
  CalendarDays,
  Scissors,
  Users,
  UserCircle,
  Clock,
  CreditCard,
  Bell,
  Settings,
  Shield,
  BarChart2,
  Star,
  Megaphone,
  MapPin,
  Activity,
  Sparkles,
  Code2,
  Hourglass,
  Ticket,
  Gift,
  Tags,
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
export const PANEL_NAVIGATION = [
  { name: "Dashboard", href: "/panel", icon: LayoutDashboard },
  { name: "Turnos", href: "/panel/turnos", icon: Calendar },
  { name: "Lista de espera", href: "/panel/lista-espera", icon: Hourglass },
  { name: "Calendario", href: "/panel/calendario", icon: CalendarDays },
  { name: "Servicios", href: "/panel/servicios", icon: Scissors },
  { name: "Equipo", href: "/panel/equipo", icon: Users },
  { name: "Clientes", href: "/panel/clientes", icon: UserCircle },
  { name: "Etiquetas", href: "/panel/etiquetas", icon: Tags },
  { name: "Horarios", href: "/panel/horarios", icon: Clock },
  { name: "Pagos", href: "/panel/pagos", icon: CreditCard },
  { name: "Cupones", href: "/panel/cupones", icon: Ticket },
  { name: "Referidos", href: "/panel/referidos", icon: Gift },
  { name: "Notificaciones", href: "/panel/notificaciones", icon: Bell },
  { name: "Reseñas", href: "/panel/reviews", icon: Star },
  { name: "Campañas", href: "/panel/campanas", icon: Megaphone },
  { name: "Sucursales", href: "/panel/sucursales", icon: MapPin },
  { name: "Analytics", href: "/panel/analytics", icon: Activity },
  { name: "Reportes", href: "/panel/reportes", icon: BarChart2 },
  { name: "Widget", href: "/panel/widget", icon: Code2 },
  { name: "Suscripción", href: "/panel/suscripcion", icon: Sparkles },
  { name: "Configuración", href: "/panel/configuracion", icon: Settings },
  { name: "Audit Log", href: "/panel/audit", icon: Shield },
] as const;
