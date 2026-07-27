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
// Order here is irrelevant — the most specific (longest) matching prefix
// always wins (see the `.reduce` below), so a narrower sub-route like
// "/leave/admin" is correctly gated independently of its broader parent
// "/leave" no matter which one is listed first. Only ADMIN holds
// leave:approve (packages/core/src/rbac.ts); without "/leave/admin" here,
// ANALYST/SALES/USER would pass the coarse gate on /leave/admin* and only
// get turned away by an unhandled ForbiddenError thrown inside the page's
// assertCan, instead of a clean /403 redirect.
const ROUTE_ROLE_REQUIREMENTS: { prefix: string; roles: Role[] }[] = [
  { prefix: "/finance", roles: ["ADMIN", "ANALYST"] },
  { prefix: "/crm", roles: ["ADMIN", "SALES"] },
  { prefix: "/hr", roles: ["ADMIN", "SALES", "USER"] },
  { prefix: "/osh", roles: ["ADMIN", "USER"] },
  { prefix: "/leave/admin", roles: ["ADMIN"] },
  { prefix: "/leave/report", roles: ["ADMIN", "ANALYST"] },
  { prefix: "/leave", roles: ["ADMIN", "ANALYST", "SALES", "USER"] },
];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isDashboardRoute = pathname.startsWith("/finance") ||
    pathname.startsWith("/tasks") ||
    pathname.startsWith("/communications") ||
    pathname.startsWith("/hr") ||
    pathname.startsWith("/osh") ||
    pathname.startsWith("/crm") ||
    pathname.startsWith("/leave");

  if (!isDashboardRoute) return NextResponse.next();

  if (!req.auth?.user) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const rule = ROUTE_ROLE_REQUIREMENTS
    .filter((r) => pathname.startsWith(r.prefix))
    .reduce<{ prefix: string; roles: Role[] } | undefined>(
      (mostSpecific, candidate) =>
        !mostSpecific || candidate.prefix.length > mostSpecific.prefix.length ? candidate : mostSpecific,
      undefined,
    );
  if (rule && !rule.roles.includes(req.auth.user.role)) {
    return NextResponse.redirect(new URL("/403", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
