export interface LeavePeriodCandidate {
  id: string;
  startDate: Date;
  endDate: Date;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
}

/** endDate must not precede startDate; both dates are inclusive calendar days. */
export function isValidLeavePeriod(startDate: Date, endDate: Date): boolean {
  return endDate.getTime() >= startDate.getTime();
}

/**
 * True if [startDate, endDate] overlaps any existing PENDING/APPROVED
 * request for the same person. REJECTED/CANCELLED requests never block —
 * only live claims on the calendar do. Kept pure/DB-free so the future
 * TASK-3/HR-6 task-assignment guard can reuse this interval check without
 * duplicating the overlap math.
 */
export function overlapsExistingLeave(
  candidate: { startDate: Date; endDate: Date },
  existing: LeavePeriodCandidate[],
): boolean {
  return existing.some((request) => {
    if (request.status !== "PENDING" && request.status !== "APPROVED") return false;
    return candidate.startDate.getTime() <= request.endDate.getTime() &&
      candidate.endDate.getTime() >= request.startDate.getTime();
  });
}
