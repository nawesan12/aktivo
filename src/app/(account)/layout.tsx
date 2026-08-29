import type { ReactNode } from "react";
import { Providers } from "@/components/providers";

/**
 * Session, theme, SWR, tooltips, toasts and the service worker — everything the
 * application itself needs. It lives per route group rather than in the root
 * layout so that `(widget)`, which renders on third-party sites, can opt out.
 */
export default function AccountLayout({ children }: { children: ReactNode }) {
  return <Providers>{children}</Providers>;
}
