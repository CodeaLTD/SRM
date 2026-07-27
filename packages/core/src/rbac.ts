import { Role } from "@codea-srm/db";

/**
 * Default-deny RBAC (PRD §6, NFR-AUTHZ). Every capability the product
 * exposes must appear here explicitly — a role sees nothing it isn't
 * granted. This table is the single source of truth; route handlers and
 * query-scoping helpers both read from it instead of hardcoding role
 * checks inline, so the role matrix can't drift between "can hit the
 * route" and "can see the row."
 */
export type Capability =
  | "finance:read"
  | "finance:write"
  | "finance:confirm"
  | "finance:delete"
  | "hr:cv:read"
  | "hr:cv:write:own"
  | "hr:cv:write:any"
  | "leave:request:own"
  | "leave:approve"
  | "leave:report:read"
  | "osh:register:manage"
  | "osh:instruction:confirm:own"
  | "crm:read"
  | "crm:write"
  | "tasks:read"
  | "tasks:write"
  | "admin:users:manage"
  | "admin:delete:critical";

const CAPABILITY_MATRIX: Record<Role, ReadonlySet<Capability>> = {
  ADMIN: new Set<Capability>([
    "finance:read",
    "finance:write",
    "finance:confirm",
    "finance:delete",
    "hr:cv:read",
    "hr:cv:write:any",
    "leave:request:own",
    "leave:approve",
    "leave:report:read",
    "osh:register:manage",
    "osh:instruction:confirm:own",
    "crm:read",
    "crm:write",
    "tasks:read",
    "tasks:write",
    "admin:users:manage",
    "admin:delete:critical",
  ]),
  ANALYST: new Set<Capability>([
    "finance:read",
    "finance:write",
    "finance:confirm",
    "leave:request:own",
    "leave:report:read",
    "tasks:read",
    "tasks:write",
  ]),
  SALES: new Set<Capability>([
    "hr:cv:read",
    "crm:read",
    "crm:write",
    "leave:request:own",
    "tasks:read",
    // PRD §6: "Own tasks / own CV / own leave / own instruction" is a ✅
    // for every role, including Sales — write access here must be scoped
    // to the caller's own tasks via scopeToOwnerUnless at the query layer.
    "tasks:write",
  ]),
  USER: new Set<Capability>([
    "hr:cv:write:own",
    "leave:request:own",
    "osh:instruction:confirm:own",
    "tasks:read",
    "tasks:write",
  ]),
};

export function can(role: Role, capability: Capability): boolean {
  return CAPABILITY_MATRIX[role]?.has(capability) ?? false;
}

/**
 * True if the role has at least one of the listed capabilities. Use this
 * (not a single `can()` call) wherever a page/action is legitimately
 * reachable two different ways — e.g. an Admin/Sales reading the whole
 * Skills Matrix vs. a User reading only their own CV — so the check
 * doesn't silently exclude the "own data" case (see rbac.test.ts for the
 * /hr regression this guards against: the route table admits USER, but
 * USER only ever holds the "own" capability, never the "any" one).
 */
export function canAny(role: Role, capabilities: Capability[]): boolean {
  return capabilities.some((capability) => can(role, capability));
}

export class ForbiddenError extends Error {
  constructor(capability: Capability | Capability[]) {
    const label = Array.isArray(capability) ? capability.join(" or ") : capability;
    super(`Role lacks capability: ${label}`);
    this.name = "ForbiddenError";
  }
}

/**
 * Route-handler / server-action guard. Throws rather than returning a
 * boolean so a missed check fails loudly instead of silently falling
 * through — callers should let this propagate into a 403, never swallow it.
 */
export function assertCan(role: Role, capability: Capability): void {
  if (!can(role, capability)) {
    throw new ForbiddenError(capability);
  }
}

/** Same as assertCan, but passes if the role holds any one of the listed capabilities. */
export function assertCanAny(role: Role, capabilities: Capability[]): void {
  if (!canAny(role, capabilities)) {
    throw new ForbiddenError(capabilities);
  }
}

/**
 * Row-level scoping for "own data only" capabilities (PRD §6: a User sees
 * only their own tasks/CV/leave/instruction). Query layers must call this
 * instead of trusting the client-supplied id — middleware route gating
 * alone is not sufficient (NFR-AUTHZ).
 */
export function scopeToOwnerUnless(
  role: Role,
  elevated: Capability,
  requesterId: string,
): { ownerId?: string } {
  return can(role, elevated) ? {} : { ownerId: requesterId };
}
