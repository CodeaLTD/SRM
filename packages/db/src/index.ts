import { PrismaClient } from "../generated/client/index.js";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

// Reuse a single client across hot reloads in dev (apps/web) and across
// the long-lived worker process (apps/worker) so neither exhausts Postgres
// connections.
export const prisma = globalThis.__prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}

export * from "../generated/client/index.js";
