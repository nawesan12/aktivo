import type { ReactNode } from "react";
import { auth } from "@/lib/auth";
import { Providers } from "@/components/providers";

/**
 * Session, theme, SWR, tooltips, toasts and the service worker — everything the
 * application itself needs.
 *
 * It lives per route group and not in the root layout because of what happens
 * two lines down: `auth()` reads cookies, so a page that calls it can never be
 * static. Behind a login that costs nothing — these pages are per-user anyway.
 * Hoisting this to the root would apply it to the landing and the shops' public
 * pages too, and those are exactly the ones that must stay static and ISR.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  // Resolved here so next-auth never has to fetch /api/auth/session from the
  // browser: this layout runs on every page of the group and the token is
  // already being decoded to authorise them.
  const session = await auth();

  return <Providers session={session}>{children}</Providers>;
}
