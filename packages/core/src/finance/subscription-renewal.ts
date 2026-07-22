export interface SubscriptionRenewalCandidate {
  id: string;
  renewsAt: Date;
  alertLeadDays: number;
  lastAlertedForRenewsAt: Date | null;
  unsubscribedAt: Date | null;
}

/**
 * Pure decision logic for FIN-7's daily renewal-scan job, kept separate
 * from the BullMQ worker so it's testable without Redis/Postgres: given
 * "today" and the active subscriptions, which ones are due an alert.
 *
 * A subscription is due once today is within its alert lead window and it
 * hasn't already been alerted for this specific `renewsAt` cycle —
 * `lastAlertedForRenewsAt` is the idempotency guard, so a rerun of the
 * same day's scan (or a crash mid-scan) never double-sends.
 */
export function findDueSubscriptions<T extends SubscriptionRenewalCandidate>(subscriptions: T[], today: Date): T[] {
  return subscriptions.filter((subscription) => {
    if (subscription.unsubscribedAt) return false;

    const alreadyAlerted =
      subscription.lastAlertedForRenewsAt !== null &&
      subscription.lastAlertedForRenewsAt.getTime() === subscription.renewsAt.getTime();
    if (alreadyAlerted) return false;

    const alertWindowStart = new Date(subscription.renewsAt);
    alertWindowStart.setUTCDate(alertWindowStart.getUTCDate() - subscription.alertLeadDays);

    return today.getTime() >= alertWindowStart.getTime() && today.getTime() <= subscription.renewsAt.getTime();
  });
}

/**
 * Rolls a subscription's renewsAt forward by one billing cycle once the
 * renewal date has passed. billingIntervalDays must be positive — a
 * zero/negative interval would never advance `next` past `today` and loop
 * forever, so that's rejected rather than silently hanging the caller.
 */
export function rollRenewalForward(renewsAt: Date, billingIntervalDays: number, today: Date): Date {
  if (billingIntervalDays < 1) {
    throw new Error(`billingIntervalDays must be a positive integer, got ${billingIntervalDays}`);
  }

  let next = new Date(renewsAt);
  while (next.getTime() <= today.getTime()) {
    next = new Date(next);
    next.setUTCDate(next.getUTCDate() + billingIntervalDays);
  }
  return next;
}
