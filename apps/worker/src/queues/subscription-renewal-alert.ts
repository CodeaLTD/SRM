import { Worker } from "bullmq";
import {
  findDueSubscriptions,
  getQueue,
  getRedisConnection,
  notifySafely,
  QueueName,
  rollRenewalForward,
} from "@codea-srm/core";
import { prisma } from "@codea-srm/db";

const DAILY_SCAN_CRON = "0 8 * * *"; // 08:00 UTC daily
const DAILY_SCAN_JOB_ID = "subscription-renewal-daily-scan";

/**
 * FIN-7 — X-days-before-renewal notification, email-only for now: the
 * in-app channel needs the COMM epic's Notification model, which doesn't
 * exist yet (see packages/core/src/notifications.ts).
 *
 * Scheduling: a single daily repeating scan job rather than one delayed
 * job per subscription. A per-subscription delayed job would need to be
 * found-and-rescheduled every time a subscription's renewsAt/alertLeadDays
 * changes or it's unsubscribed; a scan just re-evaluates current DB state
 * each run, so edits take effect for free. `lastAlertedForRenewsAt` on the
 * Subscription row is the idempotency guard (mirrors the idempotencyKey
 * pattern in health-check.ts, implemented as a DB check since this is a
 * recurring scan rather than a one-shot enqueue).
 */
export function startSubscriptionRenewalAlertWorker(): Worker {
  return new Worker(
    QueueName.SUBSCRIPTION_RENEWAL_ALERT,
    async () => {
      const today = new Date();
      const activeSubscriptions = await prisma.subscription.findMany({
        where: { unsubscribedAt: null },
        include: { owner: true },
      });

      const due = findDueSubscriptions(activeSubscriptions, today);

      for (const subscription of due) {
        // notifySafely already catches and logs — a failed send (e.g. no
        // mailbox token wired up yet) must not abort the rest of the scan,
        // and we skip the "already alerted" bookkeeping below so a failed
        // send gets retried on the next day's scan instead of being
        // silently marked as delivered.
        const sent = await notifySafely({
          userId: subscription.owner.id,
          toEmail: subscription.owner.email,
          subject: `Subscription renewing soon: ${subscription.name}`,
          bodyHtml: `<p>Your subscription is renewing on ${subscription.renewsAt.toDateString()}.</p>`,
        });
        if (!sent) continue;

        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { lastAlertedForRenewsAt: subscription.renewsAt },
        });
      }

      const passedRenewal = activeSubscriptions.filter((s) => s.renewsAt.getTime() <= today.getTime());
      for (const subscription of passedRenewal) {
        const nextRenewsAt = rollRenewalForward(subscription.renewsAt, subscription.billingIntervalDays, today);
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { renewsAt: nextRenewsAt, lastAlertedForRenewsAt: null },
        });
      }
    },
    { connection: getRedisConnection() },
  );
}

/** Registers the daily repeat schedule at worker boot. A stable jobId keeps BullMQ from duplicating the schedule across restarts. */
export async function scheduleSubscriptionRenewalDailyScan(): Promise<void> {
  await getQueue(QueueName.SUBSCRIPTION_RENEWAL_ALERT).add(
    "daily-scan",
    {},
    { repeat: { pattern: DAILY_SCAN_CRON }, jobId: DAILY_SCAN_JOB_ID },
  );
}
