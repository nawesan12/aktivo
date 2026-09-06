import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { PanelMenuProvider } from "@/components/layout/panel-menu";
import { SubscriptionBanner } from "@/components/dashboard/subscription-banner";
import { InstallPrompt } from "@/components/dashboard/install-prompt";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    /*
      `dvh`, no `vh`.

      `100vh` en iOS es el alto de la ventana *con las barras del sistema
      retraídas*, o sea más que lo que se ve. El contenedor terminaba midiendo
      más que la pantalla: el `main` de adentro tenía su propio scroll, el
      documento se movía otro poco por fuera, y las dos cosas peleaban — se
      sentía trabado y la última fila quedaba abajo de la barra. `dvh` sigue al
      área visible de verdad, y se ajusta cuando esas barras aparecen y
      desaparecen.
    */
    <PanelMenuProvider>
    <div data-app-shell className="flex h-dvh overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <SubscriptionBanner />
        {/*
          The dot grid is the page, not a decoration on it: every card in the
          design is a white surface floating over this texture.

          El colchón de abajo es el alto de la barra fija más la franja del
          iPhone: `safe-bottom` le suma `env(safe-area-inset-bottom)`, que era
          lo que faltaba para que la última fila de una lista no quedara tapada
          en los teléfonos con indicador de inicio.
        */}
        <main
          id="contenido"
          className="bg-dots safe-bottom flex-1 overflow-y-auto px-4 pt-[26px] [--safe-bottom:96px] lg:px-7 lg:[--safe-bottom:34px]"
        >
          <InstallPrompt />
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
    </PanelMenuProvider>
  );
}
