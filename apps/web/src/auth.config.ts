import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import type { Role } from "@codea-srm/db";

const WORKSPACE_DOMAIN = process.env.AUTH_GOOGLE_WORKSPACE_DOMAIN;

/**
 * Edge-safe subset of the Auth.js config — no Prisma adapter, no Node
 * built-ins. middleware.ts runs on the Edge runtime, which can't load
 * Prisma's client (needs node:fs/crypto/os); the full config in auth.ts
 * (used by route handlers and server components, which run on Node) pulls
 * this in and adds the adapter plus the Prisma-dependent `jwt` callback on
 * top. The `session` callback below only reads fields already present on
 * the decoded token — no DB access needed — so it belongs here, not in
 * auth.ts: this is what actually lets middleware.ts see `role` on
 * `req.auth.user` at all. Keep provider/callback definitions here so the
 * two configs can't drift apart.
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
      // Fail closed: an unset/misconfigured domain must lock everyone out,
      // not wave every Google account through (NFR-AUTHZ default-deny).
      if (!WORKSPACE_DOMAIN) return false;
      const email = typeof profile?.email === "string" ? profile.email : "";
      return email.endsWith(`@${WORKSPACE_DOMAIN}`);
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
} satisfies NextAuthConfig;
