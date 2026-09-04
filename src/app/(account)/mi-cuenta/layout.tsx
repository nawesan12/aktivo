import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { JikuLogo } from "@/components/brand/jiku-logo";
import { UserMenu } from "@/components/layout/user-menu";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { AccountTabs } from "@/components/layout/account-tabs";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

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
        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar />
          <main
            id="contenido"
            className="bg-dots flex-1 overflow-y-auto px-4 pb-24 pt-[26px] lg:px-7 lg:pb-[34px]"
          >
            <div className="max-w-4xl">{children}</div>
          </main>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="bg-dots min-h-screen">
      <header className="safe-top safe-x border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/mi-cuenta/perfil" aria-label="Mi cuenta">
            <JikuLogo size="sm" />
          </Link>
          <UserMenu />
        </div>
        <AccountTabs />
      </header>
      <main id="contenido" className="safe-bottom mx-auto max-w-4xl px-4 pt-8 [--safe-bottom:32px]">
        {children}
      </main>
    </div>
  );
}
