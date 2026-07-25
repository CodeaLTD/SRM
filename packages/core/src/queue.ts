import { Queue, type ConnectionOptions } from "bullmq";
import { Redis } from "ioredis";

/**
 * Shared BullMQ wiring. apps/web imports `getQueue` to *enqueue* jobs only
 * — it must never run the work inline. apps/worker is the only process
 * that constructs Workers against these same queue names (see
 * apps/worker/src/index.ts). Keeping queue names in one place stops the
 * two processes from silently drifting apart.
 */

let connection: Redis | undefined;

export function getRedisConnection(): ConnectionOptions {
  if (!connection) {
    connection = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
      maxRetriesPerRequest: null, // required by BullMQ
    });
  }
  return connection;
}

export const QueueName = {
  /** Milestone-0 smoke test queue — proves web -> redis -> worker end to end. */
  HEALTH_CHECK: "health-check",
  SUBSCRIPTION_RENEWAL_ALERT: "subscription-renewal-alert",
  OSH_DEADLINE_ALERT: "osh-deadline-alert",
  SCHEDULED_EMAIL: "scheduled-email",
} as const;

export type QueueNameValue = (typeof QueueName)[keyof typeof QueueName];

export interface HealthCheckJob {
  pingedAt: string;
  /** Idempotency key (NFR-REL) — worker should no-op if it's seen this id before. */
  idempotencyKey: string;
}

const queues = new Map<string, Queue>();

export function getQueue<T = unknown>(name: QueueNameValue): Queue<T> {
  let queue = queues.get(name) as Queue<T> | undefined;
  if (!queue) {
    queue = new Queue<T>(name, { connection: getRedisConnection() });
    queues.set(name, queue as Queue);
  }
  return queue;
}
