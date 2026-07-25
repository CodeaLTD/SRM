import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma, Role } from "@codea-srm/db";
import { authConfig } from "./auth.config";

// With `session: { strategy: "jwt" }`, this token can live for weeks — if
// we only ever looked up the role at sign-in, an Admin revoking/demoting a
// user would have no effect until that user's token expired or they
// manually re-authenticated. Re-checking on every single request would
// mean a DB round-trip per request, defeating the point of JWT sessions;
// this window is the compromise (NFR-AUTHZ: default-deny should apply
// promptly, not "eventually").
const ROLE_REVALIDATION_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Full config — Node runtime only (route handlers, server components).
 * See auth.config.ts for why the Prisma adapter can't live in the
 * edge-safe config middleware.ts uses, and why the `session` callback
 * that actually populates `role` lives there instead of here.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      const previousRefresh = token.roleRefreshedAt as number | undefined;
      const existingUserId = token.userId as string | undefined;
      const isInitialSignIn = Boolean(user);
      const isStale =
        !previousRefresh || Date.now() - previousRefresh > ROLE_REVALIDATION_INTERVAL_MS;

      if (isInitialSignIn || isStale) {
        const userId = user?.id ?? existingUserId;
        const dbUser = userId ? await prisma.user.findUnique({ where: { id: userId } }) : null;
        token.role = dbUser?.role ?? Role.USER;
        token.userId = userId;
        token.roleRefreshedAt = Date.now();
      }
      return token;
    },
  },
});
