import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

const WORKSPACE_DOMAIN = process.env.AUTH_GOOGLE_WORKSPACE_DOMAIN;

/**
 * Edge-safe subset of the Auth.js config — no Prisma adapter, no Node
 * built-ins. middleware.ts runs on the Edge runtime, which can't load
 * Prisma's client (needs node:fs/crypto/os); the full config in auth.ts
 * (used by route handlers and server components, which run on Node) pulls
 * this in and adds the adapter on top. Keep provider/callback definitions
 * here so the two configs can't drift apart.
 */
export const authConfig = {
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      authorization: { params: { hd: WORKSPACE_DOMAIN } },
    }),
  ],
  callbacks: {
    async signIn({ profile }) {
      if (!WORKSPACE_DOMAIN) return true;
      const email = typeof profile?.email === "string" ? profile.email : "";
      return email.endsWith(`@${WORKSPACE_DOMAIN}`);
    },
  },
  pages: {
    signIn: "/login",
  },
} satisfies NextAuthConfig;
