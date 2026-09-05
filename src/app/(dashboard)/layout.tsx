import type { ReactNode } from "react";
import { auth } from "@/lib/auth";
import { Providers } from "@/components/providers";

/**
 * Session, theme, SWR, tooltips, toasts and the service worker — everything the
 * application itself needs. It lives per route group rather than in the root
 * layout so that `(widget)`, which renders on third-party sites, can opt out.
 */
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  // Resolved here so next-auth never has to fetch /api/auth/session from the
  // browser: this layout runs on every page of the group and the token is
  // already being decoded to authorise them.
  const session = await auth();

  return <Providers session={session}>{children}</Providers>;
}
