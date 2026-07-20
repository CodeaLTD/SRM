import { closePdfBrowser } from "@codea-srm/core";
import { startHealthCheckWorker } from "./queues/health-check.js";
import { startOshDeadlineAlertWorker } from "./queues/osh-deadline-alert.js";
import { startScheduledEmailWorker } from "./queues/scheduled-email.js";
import { startSubscriptionRenewalAlertWorker } from "./queues/subscription-renewal-alert.js";

const workers = [
  startHealthCheckWorker(),
  startSubscriptionRenewalAlertWorker(),
  startOshDeadlineAlertWorker(),
  startScheduledEmailWorker(),
];

console.log(`[worker] listening on ${workers.length} queues`);

async function shutdown(signal: string) {
  console.log(`[worker] received ${signal}, closing workers`);
  await Promise.all(workers.map((w) => w.close()));
  await closePdfBrowser();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
