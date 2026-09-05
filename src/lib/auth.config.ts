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
      // `/invitacion` excluded on purpose: see the note in src/proxy.ts.
      const isOnAuth =
        nextUrl.pathname.startsWith("/iniciar-sesion") ||
        nextUrl.pathname.startsWith("/registrarse") ||
        nextUrl.pathname.startsWith("/recuperar-contrasena");

      // The admin area needs the role, not just a session.
      if (isOnAdmin) {
        return isLoggedIn && auth?.user?.role === "PLATFORM_ADMIN";
      }

      if (isOnPanel || isOnAccount) {
        return isLoggedIn;
      }

      if (isOnAuth && isLoggedIn) {
        // A customer has no panel. Sending them to one landed them on "algo
        // salió mal": the session was fine, there was simply no business to
        // show. Same rule as `homeFor` in src/proxy.ts.
        const home =
          auth?.user?.role === "PLATFORM_ADMIN"
            ? "/admin"
            : auth?.user?.businessId
              ? "/panel"
              : "/mi-cuenta";
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
