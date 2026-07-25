import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { auth } from "@/auth";
import { getQueue, QueueName, type HealthCheckJob } from "@codea-srm/core";

/**
 * Milestone-0 smoke test (see architecture plan §7): proves the
 * auth -> RBAC -> queue loop end to end. Requires an authenticated
 * session (any role — this only checks that the request pipeline works,
 * not a specific capability) and enqueues a job that apps/worker picks up
 * and logs, so a 202 here plus a worker log line is the whole verification.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const queue = getQueue<HealthCheckJob>(QueueName.HEALTH_CHECK);
  const idempotencyKey = randomUUID();
  await queue.add(
    "ping",
    { pingedAt: new Date().toISOString(), idempotencyKey },
    { jobId: idempotencyKey },
  );

  return NextResponse.json({ status: "ok", enqueued: idempotencyKey }, { status: 202 });
}
