import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { JikuLogo } from "@/components/brand/jiku-logo";
import { UserMenu } from "@/components/layout/user-menu";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { MobileNav } from "@/components/layout/mobile-nav";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

const tabs = [
  { name: "Perfil", href: "/mi-cuenta/perfil" },
  { name: "Seguridad", href: "/mi-cuenta/seguridad" },
  { name: "Mis turnos", href: "/mi-cuenta/turnos" },
  { name: "Notificaciones", href: "/mi-cuenta/notificaciones" },
  { name: "Referidos", href: "/mi-cuenta/referidos" },
  { name: "Negocios", href: "/mi-cuenta/negocios" },
];

/**
 * The account, inside the panel for whoever has one.
 *
 * These pages used to live in their own shell with their own header and their
 * own row of tabs, so an owner clicking "Mi cuenta" left the panel and landed
 * in what looked like a different application — and the way back was a link
 * that, for a platform admin, bounced them in a circle.
 *
 * A client who is not running a business still gets the light header: the panel
 * sidebar is a list of things they cannot do.
 */
export default async function AccountLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/iniciar-sesion");

  if (session.user.businessId) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <MobileNav />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Topbar />
          <main id="contenido" className="flex-1 overflow-y-auto p-4 lg:p-6 safe-bottom">
            <div className="max-w-4xl">{children}</div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-background/80 backdrop-blur-xl safe-top safe-x">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/mi-cuenta/perfil" aria-label="Mi cuenta">
            <JikuLogo size="sm" />
          </Link>
          <UserMenu />
        </div>
        <nav className="max-w-4xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground border-b-2 border-transparent hover:border-primary/50 transition-colors whitespace-nowrap"
            >
              {tab.name}
            </Link>
          ))}
        </nav>
      </header>
      <main id="contenido" className="max-w-4xl mx-auto px-4 py-8 safe-bottom">
        {children}
      </main>
    </div>
  );
}
