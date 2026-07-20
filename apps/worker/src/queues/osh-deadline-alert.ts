import { Worker } from "bullmq";
import { getRedisConnection, QueueName } from "@codea-srm/core";

/**
 * OSH-3 — 14-day-before-expiry Admin notification + Calendar event
 * (OSH-4). Stub until the Instruction model and OSH epic start.
 */
export function startOshDeadlineAlertWorker(): Worker {
  return new Worker(
    QueueName.OSH_DEADLINE_ALERT,
    async (): Promise<void> => {
      throw new Error("osh-deadline-alert processor not implemented yet (OSH-3/4)");
    },
    { connection: getRedisConnection() },
  );
}
