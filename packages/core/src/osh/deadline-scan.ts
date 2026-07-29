export interface InstructionDeadlineCandidate {
  id: string;
  nextPeriodicDueAt: Date | null;
  lastAlertedForDueAt: Date | null;
}

const DEFAULT_LEAD_DAYS = 14;

/**
 * Pure decision logic for OSH-3's daily deadline-scan job, kept separate
 * from the BullMQ worker so it's testable without Redis/Postgres — mirrors
 * packages/core/src/finance/subscription-renewal.ts's findDueSubscriptions.
 *
 * An instruction is due once today is within the lead window of its next
 * periodic due date and hasn't already been alerted for this specific
 * `nextPeriodicDueAt` cycle — `lastAlertedForDueAt` is the idempotency
 * guard, so a rerun of the same day's scan never double-sends.
 */
export function findDueInstructions<T extends InstructionDeadlineCandidate>(
  instructions: T[],
  today: Date,
  leadDays: number = DEFAULT_LEAD_DAYS,
): T[] {
  return instructions.filter((instruction) => {
    if (!instruction.nextPeriodicDueAt) return false;

    const alreadyAlerted =
      instruction.lastAlertedForDueAt !== null &&
      instruction.lastAlertedForDueAt.getTime() === instruction.nextPeriodicDueAt.getTime();
    if (alreadyAlerted) return false;

    const alertWindowStart = new Date(instruction.nextPeriodicDueAt);
    alertWindowStart.setUTCDate(alertWindowStart.getUTCDate() - leadDays);

    return (
      today.getTime() >= alertWindowStart.getTime() && today.getTime() <= instruction.nextPeriodicDueAt.getTime()
    );
  });
}
