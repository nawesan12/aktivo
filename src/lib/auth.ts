import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/calendar.events",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contrasena", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.hashedPassword) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.hashedPassword
        );

        if (!isValid) return null;

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
    async jwt({ token, user }) {
      const REFRESH_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

      if (user || !token.lastRefreshed || Date.now() - (token.lastRefreshed as number) > REFRESH_INTERVAL_MS) {
        const dbUser = await db.user.findUnique({
          where: { email: token.email! },
          select: {
            id: true,
            role: true,
            businesses: {
              where: { isActive: true },
              take: 1,
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
          const primaryBusiness = dbUser.businesses[0];
          if (primaryBusiness) {
            token.businessId = primaryBusiness.business.id;
            token.businessSlug = primaryBusiness.business.slug;
            token.role = primaryBusiness.role;
          }
          token.lastRefreshed = Date.now();
        }
      }
      return token;
    },
  },
});
