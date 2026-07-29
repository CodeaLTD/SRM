import { Worker } from "bullmq";
import { findDueInstructions, getQueue, getRedisConnection, notify, QueueName } from "@codea-srm/core";
import { prisma, Role } from "@codea-srm/db";

const DAILY_SCAN_CRON = "0 8 * * *"; // 08:00 UTC daily
const DAILY_SCAN_JOB_ID = "osh-deadline-daily-scan";

/**
 * OSH-3 — 14-days-before-expiry Admin notification, email-only for now:
 * the in-app channel needs the COMM epic's Notification model (doesn't
 * exist yet), and Calendar sync (OSH-4) is deferred until the Google OAuth
 * connect flow (epic-02-cont) is merged and real credentials are verified.
 * Structured identically to
 * apps/worker/src/queues/subscription-renewal-alert.ts: a daily scan over
 * current DB state (not one delayed job per instruction) with
 * `lastAlertedForDueAt` as the idempotency guard, and every notify() call
 * wrapped so a missing Google mailbox token degrades to a logged no-op
 * instead of aborting the scan — this makes the alert safe to ship before
 * Google is connected; it starts working with no further code changes.
 */
export function startOshDeadlineAlertWorker(): Worker {
  return new Worker(
    QueueName.OSH_DEADLINE_ALERT,
    async () => {
      const today = new Date();
      const instructions = await prisma.instruction.findMany({
        where: { confirmedAt: null, nextPeriodicDueAt: { not: null } },
        include: { employee: true },
      });

      const due = findDueInstructions(instructions, today);
      if (due.length === 0) return;

      const admins = await prisma.user.findMany({ where: { role: Role.ADMIN } });

      for (const instruction of due) {
        try {
          for (const admin of admins) {
            await notify({
              userId: admin.id,
              toEmail: admin.email,
              subject: `Safety instruction due soon: ${instruction.employee.name ?? instruction.employee.email}`,
              bodyHtml: `<p>${instruction.type} instruction for ${
                instruction.employee.name ?? instruction.employee.email
              } is due on ${instruction.nextPeriodicDueAt?.toDateString()}.</p>`,
            });
          }
        } catch (error) {
          // Don't let one failed send (e.g. no mailbox token wired up yet)
          // abort the rest of the scan.
          console.error(`[osh-deadline-alert] failed to notify for instruction ${instruction.id}`, error);
          continue;
        }

        await prisma.instruction.update({
          where: { id: instruction.id },
          data: { lastAlertedForDueAt: instruction.nextPeriodicDueAt },
        });
      }
    },
    { connection: getRedisConnection() },
  );
}

/** Registers the daily repeat schedule at worker boot. A stable jobId keeps BullMQ from duplicating the schedule across restarts. */
export async function scheduleOshDeadlineDailyScan(): Promise<void> {
  await getQueue(QueueName.OSH_DEADLINE_ALERT).add(
    "daily-scan",
    {},
    { repeat: { pattern: DAILY_SCAN_CRON }, jobId: DAILY_SCAN_JOB_ID },
  );
}
