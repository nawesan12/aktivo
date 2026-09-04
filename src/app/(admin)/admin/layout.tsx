import type { ReactNode } from "react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Shield, LayoutDashboard, Building2, Users, Settings, ArrowLeft } from "lucide-react";
import { AdminMobileHeader } from "@/components/admin/admin-mobile-header";
import { UserMenu } from "@/components/layout/user-menu";

const adminNav = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Negocios", href: "/admin/negocios", icon: Building2 },
  { name: "Usuarios", href: "/admin/usuarios", icon: Users },
  { name: "Sistema", href: "/admin/sistema", icon: Settings },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  if (!session?.user?.role || session.user.role !== "PLATFORM_ADMIN") {
    redirect("/panel");
  }

  return (
    <div className="min-h-screen flex">
      {/* Admin sidebar */}
      {/*
        The same dark surface the panel's sidebar uses, from the same tokens.
        It was `bg-[#0a0a0d]` with `text-muted-foreground` on it — a hex outside
        the theme paired with a grey that is now dark, so every entry was
        near-invisible the moment the app stopped being dark by default.
      */}
      <aside className="sidebar-surface hidden w-[212px] shrink-0 flex-col lg:flex">
        <div className="flex items-center gap-2 px-4 pb-[13px] pt-[15px]">
          <Shield className="size-4 text-primary" aria-hidden />
          <span className="text-[15px] font-bold tracking-[-0.03em]">jiku</span>
          <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[8.5px] font-bold tracking-[0.06em] text-warning">
            ADMIN
          </span>
        </div>
        <nav className="flex flex-1 flex-col px-[10px] pt-1 text-xs">
          {adminNav.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <item.icon className="size-3.5 shrink-0" aria-hidden />
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>
        <div className="border-t border-sidebar-border px-4 py-3">
          <Link
            href="/mi-cuenta/perfil"
            className="flex items-center gap-2 text-[11px] text-sidebar-muted transition-colors hover:text-sidebar-foreground"
          >
            <ArrowLeft className="size-3.5" aria-hidden /> Mi cuenta
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <header className="safe-top safe-x flex flex-col justify-center border-b border-border bg-card px-4 lg:px-6">
          <div className="flex h-14 items-center justify-between">
          <div className="lg:hidden">
            <AdminMobileHeader />
          </div>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-3">
            {/* There was no way out of here: the header offered "Panel", and a
                platform admin has no business, so /panel bounces them straight
                back to /admin. */}
            <UserMenu links={[{ label: "Mi cuenta", href: "/mi-cuenta" }]} />
          </div>
          </div>
        </header>
        <main id="contenido" className="bg-dots safe-bottom flex-1 px-4 pb-8 pt-[26px] lg:px-7">{children}</main>
      </div>
    </div>
  );
}
