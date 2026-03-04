import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((request: NextRequest) => {
  const { pathname } = request.nextUrl;

  // Protect dashboard routes
  const isOnPanel = pathname.startsWith("/panel");
  const isOnAdmin = pathname.startsWith("/admin");
  const isOnAccount = pathname.startsWith("/mi-cuenta");
  const isAuthenticated = !!(request as unknown as { auth?: { user?: unknown } }).auth?.user;

  if ((isOnPanel || isOnAdmin || isOnAccount) && !isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = "/iniciar-sesion";
    url.searchParams.set("callbackUrl", pathname);
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
    url.pathname = "/panel";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/panel/:path*",
    "/admin/:path*",
    "/mi-cuenta/:path*",
    "/iniciar-sesion",
    "/registrarse",
    "/recuperar-contrasena",
    "/invitacion",
    "/((?!_next/static|_next/image|favicon.ico|api/).*)",
  ],
};
