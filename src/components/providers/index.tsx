"use client";

import { type ReactNode, useEffect } from "react";
import { ThemeProvider } from "./theme-provider";
import { GSAPProvider } from "./gsap-provider";
import { SessionProvider } from "./session-provider";
import { SWRProvider } from "./swr-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  return (
    <SessionProvider>
      <ThemeProvider>
        <SWRProvider>
          <GSAPProvider>
            <TooltipProvider>
              {children}
              <Toaster richColors position="bottom-right" />
            </TooltipProvider>
          </GSAPProvider>
        </SWRProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
