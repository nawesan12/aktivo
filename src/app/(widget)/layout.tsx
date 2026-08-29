import type { ReactNode } from "react";
import { SWRProvider } from "@/components/providers/swr-provider";

/**
 * The widget runs inside an iframe on our customers' websites. It gets the SWR
 * fetcher it actually uses and nothing else.
 *
 * What it deliberately does *not* get, and used to inherit from the root
 * layout: a service worker registration (installed on someone else's origin),
 * a NextAuth session provider polling `/api/auth/session` for a session that
 * cannot exist there, GSAP with ScrollTrigger, tooltips and a toaster.
 */
export default function WidgetLayout({ children }: { children: ReactNode }) {
  return <SWRProvider>{children}</SWRProvider>;
}
