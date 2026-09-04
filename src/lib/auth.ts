import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { authConfig } from "./auth.config";
import { rateLimit, peekRateLimit, getClientIP } from "@/lib/rate-limit";
import { env } from "@/lib/env";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  providers: [
    // Registrado sólo si hay credenciales. Sin ellas el proveedor igual existía,
    // con clientId undefined, así que /api/auth/signin/google mandaba al usuario
    // a Google para que Google le dijera `invalid_client`. El README decía que
    // sin estas variables el login con Google se ocultaba; no era cierto.
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
            authorization: {
              params: {
                scope:
                  "openid email profile https://www.googleapis.com/auth/calendar.events",
                access_type: "offline",
                prompt: "consent",
              },
            },
          }),
        ]
      : []),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) return null;

        // Password login had no rate limit at all: bcrypt slows an attacker
        // down but never stops them. Two independent budgets — one per IP
        // (someone spraying many accounts) and one per account (a distributed
        // attempt against a single user).
        //
        // The budget is spent by *failures* only. Charging every attempt meant
        // that signing in five times in a quarter of an hour — a second device,
        // an expired session — locked the account, while a brute force run, all
        // failures, faced exactly the same ceiling.
        const ip = getClientIP(request as unknown as Request);
        const emailKey = String(credentials.email).toLowerCase();
        const ipBudget = { key: `login:ip:${ip}`, limit: 10, windowMs: 15 * 60_000 };
        const accountBudget = { key: `login:email:${emailKey}`, limit: 5, windowMs: 15 * 60_000 };

        const [byIp, byAccount] = await Promise.all([
          peekRateLimit(ipBudget),
          peekRateLimit(accountBudget),
        ]);

        if (!byIp.success || !byAccount.success) {
          throw new Error("Demasiados intentos fallidos. Probá de nuevo en unos minutos.");
        }

        const spendAttempt = () =>
          Promise.all([rateLimit(ipBudget), rateLimit(accountBudget)]);

        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.hashedPassword) {
          await spendAttempt();
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.hashedPassword
        );

        if (!isValid) {
          await spendAttempt();
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger, session }) {
      const REFRESH_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

      const stale =
        !token.lastRefreshed ||
        Date.now() - (token.lastRefreshed as number) > REFRESH_INTERVAL_MS;

      // `update` is how the location switcher asks for a different business.
      // It never trusts the id it is given: the memberships are re-read below
      // and the switch only happens if one of them matches.
      const requestedBusinessId =
        trigger === "update" && typeof session?.businessId === "string"
          ? session.businessId
          : null;

      if (user || stale || requestedBusinessId) {
        const dbUser = await db.user.findUnique({
          where: { email: token.email! },
          select: {
            id: true,
            role: true,
            businesses: {
              where: { isActive: true },
              // Every membership, deterministically ordered. Reading a single
              // row with no ordering meant that for anyone with more than one
              // business the active one was decided at random on each refresh —
              // and that switching branches never survived it.
              orderBy: { business: { name: "asc" } },
              select: {
                role: true,
                business: { select: { id: true, slug: true } },
              },
            },
          },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;

          const memberships = dbUser.businesses;
          const active =
            (requestedBusinessId &&
              memberships.find((m) => m.business.id === requestedBusinessId)) ||
            // Keep whatever was already active across a plain refresh.
            memberships.find((m) => m.business.id === token.businessId) ||
            memberships[0];

          if (active) {
            token.businessId = active.business.id;
            token.businessSlug = active.business.slug;
            token.role = active.role;
          }

          token.lastRefreshed = Date.now();
        }
      }
      return token;
    },
  },
});
