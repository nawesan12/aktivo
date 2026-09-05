"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import type { ReactNode } from "react";

/**
 * The session comes in from the server and is not re-read.
 *
 * It is a JWT with a month of life, and the layouts that mount this already
 * decoded it to render the page. Handing it over means next-auth never calls
 * `/api/auth/session` at all.
 *
 * next-auth refetches `/api/auth/session` on every window focus by default —
 * one serverless invocation each time somebody alt-tabs back to the panel, all
 * day, to decode a token that has not changed. It is off here.
 *
 * Nothing depends on the refetch: switching branch does a full reload, and a
 * session that really did expire is caught by the API answering 401, which the
 * auth layer already turns into a redirect.
 */
export function SessionProvider({
  children,
  session,
}: {
  children: ReactNode;
  session?: Session | null;
}) {
  return (
    <NextAuthSessionProvider
      session={session}
      refetchOnWindowFocus={false}
      refetchInterval={0}
    >
      {children}
    </NextAuthSessionProvider>
  );
}
