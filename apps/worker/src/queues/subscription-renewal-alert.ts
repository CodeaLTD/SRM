import { Worker } from "bullmq";
import { getRedisConnection, QueueName } from "@codea-srm/core";

/**
 * FIN-7 — X-days-before-renewal notification. Stub until the Subscription
 * model and finance epic start; registered now so the queue name and
 * connection wiring are already correct when that epic begins.
 */
export function startSubscriptionRenewalAlertWorker(): Worker {
  return new Worker(
    QueueName.SUBSCRIPTION_RENEWAL_ALERT,
    async (): Promise<void> => {
      throw new Error("subscription-renewal-alert processor not implemented yet (FIN-7)");
    },
    { connection: getRedisConnection() },
  );
}
