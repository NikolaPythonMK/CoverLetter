// src/lib/auth.ts
import type { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import AppleProvider from "next-auth/providers/apple";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },

  providers: [
    // Comment out providers you don't use yet (or guard env reads) to avoid env errors.
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID ?? "",
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET ?? "",
    }),
    AppleProvider({
      clientId: process.env.APPLE_CLIENT_ID ?? "",
      clientSecret: process.env.APPLE_CLIENT_SECRET ?? "",
    }),

    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;
        const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        if (!user?.passwordHash) return null; // OAuth-only account or no pw set
        const ok = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!ok) return null;
        // Return minimal fields; plan is convenient here too
        return { id: user.id, email: user.email, name: user.name, plan: (user as any).plan ?? "free" } as any;
      },
    }),
  ],

  callbacks: {
    async redirect({ url, baseUrl }) {
      const u = new URL(url, baseUrl);
      if (u.origin === baseUrl) return u.toString();
      if (u.hostname === "buy.paddle.com") return u.toString();
      return baseUrl;
    },

    async jwt({ token, user }) {
      // On sign-in, copy from user → token
      if (user) {
        token.id = (user as any).id;
        token.plan = (user as any).plan ?? "free";
      }
      // On subsequent requests, ensure token stays in sync with DB
      if (!token.id && token.email) {
        const dbUser = await prisma.user.findUnique({ where: { email: token.email as string } });
        if (dbUser) {
          token.id = dbUser.id;
          token.plan = (dbUser as any).plan ?? "free";
        }
      }
      return token;
    },

    // IMPORTANT: with strategy "jwt", use the TOKEN, not "user"
    async session({ session, token }) {
      (session.user as any).id = token.id as string | undefined;
      (session.user as any).plan = (token as any).plan ?? "free";
      return session;
    },
  },

  pages: { signIn: "/login" },
  secret: process.env.NEXTAUTH_SECRET,
};
