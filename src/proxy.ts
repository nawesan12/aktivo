import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authConfig } from "@/lib/auth.config";

/**
 * Runs before every matched request.
 *
 * Renamed from `middleware.ts`: Next 16 deprecated that convention in favour of
 * `proxy`, to stop it being read as Express-style middleware.
 */

const { auth } = NextAuth(authConfig);

type AuthedRequest = NextRequest & {
  auth?: { user?: { role?: string; businessId?: string | null } };
};

export default auth((request: NextRequest) => {
  const { pathname } = request.nextUrl;
  const user = (request as AuthedRequest).auth?.user;
  const isAuthenticated = !!user;

  // Admin surface: both the pages and their API. Enforced here so that adding a
  // new /api/admin route can't accidentally ship without a role check — each
  // route still checks too, this is the floor, not the only lock.
  const isOnAdmin = pathname.startsWith("/admin");
  const isOnAdminApi = pathname.startsWith("/api/admin");

  if (isOnAdminApi) {
    if (!isAuthenticated) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (user?.role !== "PLATFORM_ADMIN") {
      return NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 });
    }
    return NextResponse.next();
  }

  // Protect dashboard routes
  const isOnPanel = pathname.startsWith("/panel");
  const isOnAccount = pathname.startsWith("/mi-cuenta");

  if ((isOnPanel || isOnAdmin || isOnAccount) && !isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = "/iniciar-sesion";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // Logged in, but not a platform admin: send them to their own panel rather
  // than leaving the admin shell to decide.
  if (isOnAdmin && user?.role !== "PLATFORM_ADMIN") {
    const url = request.nextUrl.clone();
    url.pathname = "/panel";
    return NextResponse.redirect(url);
  }

  // The panel is a business's panel: everything under it reads the session's
  // business. A platform administrator has none of their own, so landing them
  // here after login only produced "algo salió mal" — the session was valid,
  // there was simply nothing to show.
  if (isOnPanel && isAuthenticated && !user?.businessId) {
    const url = request.nextUrl.clone();
    url.pathname = user?.role === "PLATFORM_ADMIN" ? "/admin" : "/mi-cuenta/negocios";
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth pages
  const isOnAuth =
    pathname.startsWith("/iniciar-sesion") ||
    pathname.startsWith("/registrarse") ||
    pathname.startsWith("/recuperar-contrasena") ||
    pathname.startsWith("/invitacion");

  if (isOnAuth && isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = user?.role === "PLATFORM_ADMIN" ? "/admin" : "/panel";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

/**
 * Only the paths this file actually decides something about.
 *
 * There used to be a catch-all here as well, and every branch above already
 * keys on one of these prefixes — so the catch-all bought nothing and cost a
 * function invocation on the landing page, on every SVG and PNG in `public/`,
 * on the sitemap, and on each `.rsc` payload of client-side navigation. On a
 * plan billed by invocation that was the single largest multiplier in the app.
 */
export const config = {
  matcher: [
    "/panel/:path*",
    "/admin/:path*",
    "/api/admin/:path*",
    "/mi-cuenta/:path*",
    "/iniciar-sesion",
    "/registrarse",
    "/recuperar-contrasena",
    "/invitacion",
  ],
};
