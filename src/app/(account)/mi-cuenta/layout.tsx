import type { ReactNode } from "react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { JikuLogo } from "@/components/brand/jiku-logo";

const tabs = [
  { name: "Perfil", href: "/mi-cuenta/perfil" },
  { name: "Seguridad", href: "/mi-cuenta/seguridad" },
  { name: "Mis Turnos", href: "/mi-cuenta/turnos" },
  { name: "Negocios", href: "/mi-cuenta/negocios" },
];

export default async function AccountLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/iniciar-sesion");

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/">
            <JikuLogo size="sm" />
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:block">{session.user.name}</span>
            <Link
              href="/panel"
              className="text-sm text-primary hover:underline"
            >
              Volver al panel
            </Link>
          </div>
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
      <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
