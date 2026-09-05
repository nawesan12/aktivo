"use client";

import { type ReactNode, useEffect } from "react";
import type { Session } from "next-auth";
import { ThemeProvider } from "./theme-provider";
import { SessionProvider } from "./session-provider";
import { SWRProvider } from "./swr-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

/**
 * `session` is passed by the layouts that already resolved it on the server.
 *
 * Without it next-auth fetches `/api/auth/session` the moment the provider
 * mounts — a serverless invocation on every page load of the panel, to decode a
 * token the server had already decoded to render that same page.
 */
export function Providers({
  children,
  session,
}: {
  children: ReactNode;
  session?: Session | null;
}) {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  return (
    <SessionProvider session={session}>
      <ThemeProvider>
        <SWRProvider>
          <TooltipProvider>
            {children}
            <Toaster richColors position="bottom-right" />
          </TooltipProvider>
        </SWRProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
