import { prisma } from "@codea-srm/db";
import { decryptToken, encryptToken } from "./token-crypto";

/**
 * The only place GoogleToken is read or written. Every module (TASK-3
 * today, HR-6/OSH-4 later) goes through this instead of touching
 * `prisma.googleToken` directly, so encryption is never accidentally
 * skipped at a new call site.
 */

export async function saveGoogleRefreshToken(
  userId: string,
  scope: string,
  refreshToken: string,
  expiresAt: Date,
): Promise<void> {
  const encryptedBlob = encryptToken(refreshToken);
  await prisma.googleToken.upsert({
    where: { userId_scope: { userId, scope } },
    create: { userId, scope, encryptedBlob, expiresAt },
    update: { encryptedBlob, expiresAt },
  });
}

export async function deleteGoogleToken(userId: string, scope: string): Promise<void> {
  await prisma.googleToken.deleteMany({ where: { userId, scope } });
}

export async function getGoogleRefreshToken(userId: string, scope: string): Promise<string | null> {
  const token = await prisma.googleToken.findUnique({ where: { userId_scope: { userId, scope } } });
  return token ? decryptToken(token.encryptedBlob) : null;
}

/** Batched form — one query for every assignee's token instead of one round trip each. */
export async function getGoogleRefreshTokens(userIds: string[], scope: string): Promise<Map<string, string>> {
  if (userIds.length === 0) return new Map();
  const tokens = await prisma.googleToken.findMany({ where: { userId: { in: userIds }, scope } });
  return new Map(tokens.map((token) => [token.userId, decryptToken(token.encryptedBlob)]));
}
