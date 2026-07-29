import { describe, expect, it } from "vitest";
import { Role } from "@codea-srm/db";
import {
  assertCan,
  assertCanAny,
  can,
  canAny,
  ForbiddenError,
  scopeToOwnerUnless,
  type Capability,
} from "../src/rbac";

/**
 * These cases are transcribed directly from PRD §6's RBAC table — that
 * table, not this file, is the source of truth. If a requirement changes,
 * update the PRD first, then this test, then rbac.ts.
 */
describe("can — PRD §6 role matrix", () => {
  it.each<[Capability, Role[]]>([
    // "Delete critical data" — Admin only.
    ["admin:delete:critical", [Role.ADMIN]],
    // "Approve leave" — Admin only.
    ["leave:approve", [Role.ADMIN]],
    // Finance read+edit — Admin + Analyst only.
    ["finance:read", [Role.ADMIN, Role.ANALYST]],
    ["finance:write", [Role.ADMIN, Role.ANALYST]],
    // Confirming a "За проверка" transaction commits it to the ledger view
    // (FIN-5) — modeled as its own capability, currently the same role set
    // as finance:write, so intent is explicit at each call site.
    ["finance:confirm", [Role.ADMIN, Role.ANALYST]],
    // HR CVs / Skills Matrix — Admin + Sales full access; Analyst none.
    ["hr:cv:read", [Role.ADMIN, Role.SALES]],
    // Business Network (CRM) — Admin + Sales only.
    ["crm:read", [Role.ADMIN, Role.SALES]],
    ["crm:write", [Role.ADMIN, Role.SALES]],
    // ЗБУТ register management — Admin only (Analyst is "awareness only",
    // Sales has none, User only confirms their own).
    ["osh:register:manage", [Role.ADMIN]],
    // Analyst "awareness only" — read the register, no create/edit/confirm.
    ["osh:register:read", [Role.ANALYST]],
    // Own instruction confirmation — Admin + User (PRD: "own confirmation").
    ["osh:instruction:confirm:own", [Role.ADMIN, Role.USER]],
    // "Own tasks" is a checkmark for every role in the PRD table.
    ["tasks:read", [Role.ADMIN, Role.ANALYST, Role.SALES, Role.USER]],
    ["tasks:write", [Role.ADMIN, Role.ANALYST, Role.SALES, Role.USER]],
    // "Own leave" is a checkmark for every role.
    ["leave:request:own", [Role.ADMIN, Role.ANALYST, Role.SALES, Role.USER]],
  ])("%s is granted to exactly %j", (capability, expectedRoles) => {
    for (const role of Object.values(Role)) {
      expect(can(role, capability), `${role} x ${capability}`).toBe(
        expectedRoles.includes(role),
      );
    }
  });

  it("default-denies capabilities not explicitly granted to a role", () => {
    // hr:cv:write:any is only ever granted to ADMIN — confirms the matrix
    // has no fallback that silently grants access to unlisted capabilities.
    expect(can(Role.ANALYST, "hr:cv:write:any")).toBe(false);
    expect(can(Role.SALES, "hr:cv:write:any")).toBe(false);
    expect(can(Role.USER, "hr:cv:write:any")).toBe(false);
  });
});

describe("assertCan", () => {
  it("does not throw when the role has the capability", () => {
    expect(() => assertCan(Role.ADMIN, "admin:delete:critical")).not.toThrow();
  });

  it("throws ForbiddenError when the role lacks the capability", () => {
    expect(() => assertCan(Role.USER, "admin:delete:critical")).toThrow(ForbiddenError);
    expect(() => assertCan(Role.SALES, "finance:read")).toThrow(ForbiddenError);
  });
});

describe("canAny / assertCanAny", () => {
  // Regression test for the /hr page bug: middleware's ROUTE_ROLE_REQUIREMENTS
  // admits USER to /hr, but USER only ever holds hr:cv:write:own, never
  // hr:cv:read — a plain assertCan("hr:cv:read") throws for a legitimate USER.
  const HR_PAGE_CAPABILITIES: Capability[] = ["hr:cv:read", "hr:cv:write:own"];

  it("is true for a role holding only the 'own' capability, not the 'any' one", () => {
    expect(canAny(Role.USER, HR_PAGE_CAPABILITIES)).toBe(true);
  });

  it("is true for a role holding the full-access capability", () => {
    expect(canAny(Role.ADMIN, HR_PAGE_CAPABILITIES)).toBe(true);
    expect(canAny(Role.SALES, HR_PAGE_CAPABILITIES)).toBe(true);
  });

  it("is false when the role holds neither capability", () => {
    expect(canAny(Role.ANALYST, HR_PAGE_CAPABILITIES)).toBe(false);
  });

  it("assertCanAny does not throw when at least one capability matches", () => {
    expect(() => assertCanAny(Role.USER, HR_PAGE_CAPABILITIES)).not.toThrow();
  });

  it("assertCanAny throws ForbiddenError when none match", () => {
    expect(() => assertCanAny(Role.ANALYST, HR_PAGE_CAPABILITIES)).toThrow(ForbiddenError);
  });
});

describe("scopeToOwnerUnless", () => {
  it("returns no filter for a role with the elevated capability", () => {
    expect(scopeToOwnerUnless(Role.ADMIN, "leave:approve", "user-1")).toEqual({});
  });

  it("scopes to the requester's own records otherwise", () => {
    expect(scopeToOwnerUnless(Role.USER, "leave:approve", "user-1")).toEqual({
      ownerId: "user-1",
    });
  });
});
