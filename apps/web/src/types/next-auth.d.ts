import type { Role } from "@codea-srm/db";
import type { DefaultSession } from "next-auth";

// Augment Auth.js's session/JWT shape with the fields RBAC checks depend
// on everywhere else in the app — role and a stable user id.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    role?: Role;
  }
}
