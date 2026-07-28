/**
 * A task is visible/actionable only to its creator or one of its
 * assignees — tasks:read/tasks:write are granted to every Role
 * (packages/core/src/rbac.ts), so there's no "any" capability to escape
 * this filter with; visibility is enforced entirely at the query layer.
 * Shared across every read site (board, list, detail) so the three
 * copies can't drift — an inconsistent OR clause here would be a real
 * data-layer authz bug, not just duplicated boilerplate.
 */
export function taskVisibilityWhere(userId: string) {
  return {
    OR: [{ createdById: userId }, { assignees: { some: { userId } } }],
  };
}
