import type { ReactNode } from "react";
import { Providers } from "@/components/providers";

/**
 * Session, theme, SWR, tooltips, toasts and the service worker — everything the
 * application itself needs.
 *
 * It lives per route group and not in the root layout, which now matters for a
 * different reason than it used to: the panel groups resolve the session on the
 * server and hand it to the provider, and `auth()` reads cookies. Hoisting this
 * to the root would drag that call onto the landing and the shops' public
 * pages, which are static and ISR today, and turn every one of them into a
 * function invocation per visitor.
 */
export default function PublicLayout({ children }: { children: ReactNode }) {
  return <Providers>{children}</Providers>;
}
