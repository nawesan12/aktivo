import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { SubscriptionBanner } from "@/components/dashboard/subscription-banner";
import { InstallPrompt } from "@/components/dashboard/install-prompt";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <SubscriptionBanner />
        {/*
          The dot grid is the page, not a decoration on it: every card in the
          design is a white surface floating over this texture. pb-24 on small
          screens is the bottom bar's height — without it the last row of any
          list sits under the "+" button.
        */}
        <main id="contenido" className="bg-dots flex-1 overflow-y-auto px-4 pb-24 pt-[26px] lg:px-7 lg:pb-[34px]">
          <InstallPrompt />
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
