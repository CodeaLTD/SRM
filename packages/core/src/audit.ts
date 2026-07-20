import { prisma, type Role } from "@codea-srm/db";

export interface AuditEntryInput {
  actorId?: string;
  actorRole?: Role;
  action: string;
  resource: string;
  resourceId?: string;
  ipAddress?: string;
  metadata?: Record<string, unknown>;
}

/**
 * The only supported way to write to audit_log. The table itself rejects
 * UPDATE/DELETE at the DB level (see
 * packages/db/prisma/migrations/20260101000000_audit_log_immutability) —
 * this function exists so every module logs through one code path instead
 * of constructing Prisma calls inline, keeping the shape of entries
 * consistent (NFR-AUDIT).
 */
export async function recordAuditEntry(entry: AuditEntryInput): Promise<void> {
  await prisma.auditLog.create({
    data: {
      actorId: entry.actorId,
      actorRole: entry.actorRole,
      action: entry.action,
      resource: entry.resource,
      resourceId: entry.resourceId,
      ipAddress: entry.ipAddress,
      metadata: entry.metadata as never,
    },
  });
}
