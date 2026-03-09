import type { ReactNode } from "react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Shield, LayoutDashboard, Building2, Users, Settings, ArrowLeft, LogOut } from "lucide-react";
import { AdminMobileHeader } from "@/components/admin/admin-mobile-header";

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
      <aside className="hidden lg:flex flex-col w-64 border-r border-sidebar-border bg-[#0a0a0d]">
        <div className="flex h-16 items-center px-4 border-b border-sidebar-border gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <span className="font-heading text-lg font-bold">Jiku Admin</span>
        </div>
        <nav className="flex-1 py-4 px-2 space-y-1">
          {adminNav.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all"
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-sidebar-border space-y-2">
          <Link
            href="/panel"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Ir al panel
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <header className="h-16 border-b border-border bg-background/80 backdrop-blur-xl flex items-center justify-between px-4 lg:px-6">
          <div className="lg:hidden">
            <AdminMobileHeader />
          </div>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{session.user.name}</span>
            <Link href="/panel" className="text-sm text-primary hover:underline">
              Panel
            </Link>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
