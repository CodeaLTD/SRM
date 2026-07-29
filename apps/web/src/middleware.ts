import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";
import type { Role } from "@codea-srm/db";

// Uses the edge-safe config (no Prisma adapter) — see auth.config.ts.
const { auth } = NextAuth(authConfig);

/**
 * Coarse, route-level RBAC gate (NFR-AUTHZ layer 1 of 2 — see
 * packages/core/src/rbac.ts for layer 2, the data-layer scoping every
 * query must also apply). This middleware answers "can this role be here
 * at all"; it never substitutes for the fine-grained checks inside each
 * route handler. Default-deny: an unlisted path under (dashboard) falls
 * through to "any authenticated role", not "any role including none."
 */
const ROUTE_ROLE_REQUIREMENTS: { prefix: string; roles: Role[] }[] = [
  { prefix: "/finance", roles: ["ADMIN", "ANALYST"] },
  { prefix: "/crm", roles: ["ADMIN", "SALES"] },
  { prefix: "/hr", roles: ["ADMIN", "SALES", "USER"] },
  { prefix: "/osh", roles: ["ADMIN", "USER", "ANALYST"] },
];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isDashboardRoute = pathname.startsWith("/finance") ||
    pathname.startsWith("/tasks") ||
    pathname.startsWith("/communications") ||
    pathname.startsWith("/hr") ||
    pathname.startsWith("/osh") ||
    pathname.startsWith("/crm");

  if (!isDashboardRoute) return NextResponse.next();

  if (!req.auth?.user) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const rule = ROUTE_ROLE_REQUIREMENTS.find((r) => pathname.startsWith(r.prefix));
  if (rule && !rule.roles.includes(req.auth.user.role)) {
    return NextResponse.redirect(new URL("/403", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
