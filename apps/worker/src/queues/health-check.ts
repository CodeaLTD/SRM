import { Worker } from "bullmq";
import { getRedisConnection, QueueName, type HealthCheckJob } from "@codea-srm/core";

/**
 * Milestone-0 smoke test worker (architecture plan §7): consumes what
 * apps/web's /api/health route enqueues. A log line here is the proof
 * that web -> Redis -> worker actually works end to end.
 */
export function startHealthCheckWorker(): Worker<HealthCheckJob> {
  return new Worker<HealthCheckJob>(
    QueueName.HEALTH_CHECK,
    async (job) => {
      console.log(`[health-check] received ping from ${job.data.pingedAt} (idempotencyKey=${job.data.idempotencyKey})`);
    },
    { connection: getRedisConnection() },
  );
}
