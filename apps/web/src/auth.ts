import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma, Role } from "@codea-srm/db";
import { authConfig } from "./auth.config";

/**
 * Full config — Node runtime only (route handlers, server components).
 * See auth.config.ts for why the Prisma adapter can't live in the
 * edge-safe config middleware.ts uses.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
        token.role = dbUser?.role ?? Role.USER;
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
});
