import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/iniciar-sesion",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnPanel = nextUrl.pathname.startsWith("/panel");
      const isOnAdmin = nextUrl.pathname.startsWith("/admin");
      const isOnAccount = nextUrl.pathname.startsWith("/mi-cuenta");
      const isOnAuth =
        nextUrl.pathname.startsWith("/iniciar-sesion") ||
        nextUrl.pathname.startsWith("/registrarse") ||
        nextUrl.pathname.startsWith("/recuperar-contrasena") ||
        nextUrl.pathname.startsWith("/invitacion");

      // The admin area needs the role, not just a session.
      if (isOnAdmin) {
        return isLoggedIn && auth?.user?.role === "PLATFORM_ADMIN";
      }

      if (isOnPanel || isOnAccount) {
        return isLoggedIn;
      }

      if (isOnAuth && isLoggedIn) {
        const home = auth?.user?.role === "PLATFORM_ADMIN" ? "/admin" : "/panel";
        return Response.redirect(new URL(home, nextUrl));
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string) || "CLIENT";
        session.user.businessId = (token.businessId as string) || null;
        session.user.businessSlug = token.businessSlug as string | undefined;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
