import { Worker } from "bullmq";
import { getRedisConnection, QueueName } from "@codea-srm/core";

/**
 * COMM-2 — send an email/document at a specific future time, ±1 min
 * (G4). Stub until the ScheduledEmail model and COMM epic start.
 */
export function startScheduledEmailWorker(): Worker {
  return new Worker(
    QueueName.SCHEDULED_EMAIL,
    async (): Promise<void> => {
      throw new Error("scheduled-email processor not implemented yet (COMM-2)");
    },
    { connection: getRedisConnection() },
  );
}
