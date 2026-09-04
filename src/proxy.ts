import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authConfig } from "@/lib/auth.config";
import { businessSlugForHost } from "@/lib/custom-domain";

/**
 * Where a signed-in person belongs.
 *
 * One place for it: the landing redirect, the auth-page redirect and the
 * panel-without-a-business redirect were all answering the same question and
 * would have drifted.
 */
function homeFor(user: { role?: string; businessId?: string | null } | undefined): string {
  if (user?.role === "PLATFORM_ADMIN") return "/admin";
  return user?.businessId ? "/panel" : "/mi-cuenta";
}

/** Our own host, plus the deployment URLs Vercel gives every build. */
function isOwnHost(host: string): boolean {
  const hostname = host.toLowerCase().split(":")[0];
  const appHost = new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://jikuapp.com").hostname;

  return (
    hostname === appHost ||
    hostname === `www.${appHost}` ||
    hostname === "localhost" ||
    hostname.endsWith(".vercel.app")
  );
}

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

export default auth(async (request: NextRequest) => {
  const { pathname } = request.nextUrl;

  // ── Custom domains ──────────────────────────────────────────────────────
  // A request that did not arrive on our own host came in on a business's
  // domain, and everything on it belongs to that business's page. The matcher
  // below is what keeps this from costing anything: normal traffic on
  // jikuapp.com never reaches this file for these paths.
  const host = request.headers.get("host");
  if (host && !isOwnHost(host)) {
    const slug = await businessSlugForHost(host);

    // An unknown host is a domain someone pointed at us without connecting it,
    // or a preview deployment. Neither should render a business's page.
    if (!slug) return NextResponse.next();

    const url = request.nextUrl.clone();
    url.pathname = `/${slug}${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }

  const user = (request as AuthedRequest).auth?.user;
  const isAuthenticated = !!user;

  // Someone who is already signed in has no business on the sales page: they
  // came to work, and the landing is an ad for a product they already bought.
  // The matcher only routes "/" here when a session cookie is present, so an
  // anonymous visit — which is all the traffic the landing actually gets —
  // never reaches this function at all.
  if (pathname === "/" && isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = homeFor(user);
    return NextResponse.redirect(url);
  }

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
    // Not `homeFor`: a business owner between businesses needs the picker, not
    // their account page.
    url.pathname = user?.role === "PLATFORM_ADMIN" ? "/admin" : "/mi-cuenta/negocios";
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth pages
  // `/invitacion` is deliberately not here. It is the one page in this group a
  // signed-in person needs to reach: someone who already has an account clicks
  // the invitation in their mail, and bouncing them to /panel meant team
  // invitations only ever worked for people without an account.
  const isOnAuth =
    pathname.startsWith("/iniciar-sesion") ||
    pathname.startsWith("/registrarse") ||
    pathname.startsWith("/recuperar-contrasena");

  if (isOnAuth && isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = homeFor(user);
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
    // Every path, but only when the request did not arrive on our own host.
    // Custom domains need the host to be inspected on each request; putting the
    // condition in the matcher means a visit to jikuapp.com never pays for it.
    {
      source: "/((?!_next/|favicon.ico|.*\\.[a-z0-9]+$).*)",
      missing: [{ type: "host", value: "jikuapp.com" }],
    },
    // The landing, but only for a request that carries a session cookie: an
    // anonymous visit — which is all the traffic the landing actually gets —
    // never invokes this function, so the page stays a CDN hit.
    //
    // Written out one by one because Next requires the matcher to be a static
    // literal. Both names appear because the cookie prefix depends on the
    // scheme, and the `.0` forms because Auth.js splits a large session across
    // numbered chunks; missing one would leave a signed-in owner on the sales
    // page.
    { source: "/", has: [{ type: "cookie", key: "authjs.session-token" }] },
    { source: "/", has: [{ type: "cookie", key: "authjs.session-token.0" }] },
    { source: "/", has: [{ type: "cookie", key: "__Secure-authjs.session-token" }] },
    { source: "/", has: [{ type: "cookie", key: "__Secure-authjs.session-token.0" }] },
    "/panel/:path*",
    "/admin/:path*",
    "/api/admin/:path*",
    "/mi-cuenta/:path*",
    "/iniciar-sesion",
    "/registrarse",
    "/recuperar-contrasena",
  ],
};
