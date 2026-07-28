export const TASK_STATUSES = ["TODO", "IN_PROGRESS", "DONE"] as const;
export type TaskStatusValue = (typeof TASK_STATUSES)[number];

export const TASK_STATUS_LABELS: Record<TaskStatusValue, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
};

/**
 * Free-form Kanban today — any status may transition to any other status,
 * unlike LeaveRequest's gated PENDING-only transitions. Named as a
 * predicate (not inlined `true`) so a future gated-workflow rule (e.g.
 * "can't skip IN_PROGRESS") has a single call site to change.
 */
export function isValidTaskStatusTransition(to: TaskStatusValue): boolean {
  return TASK_STATUSES.includes(to);
}

/**
 * A task deadline is date-only (`<input type="date">` — no time-of-day in
 * the Task model), so the Calendar event spans the whole UTC day rather
 * than a single instant. Kept here as a pure, unit-testable helper rather
 * than inlined at the call site in tasks/actions.ts.
 */
export function taskDeadlineToEventWindow(deadline: Date): { startIso: string; endIso: string } {
  const start = new Date(Date.UTC(deadline.getUTCFullYear(), deadline.getUTCMonth(), deadline.getUTCDate()));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { startIso: start.toISOString(), endIso: end.toISOString() };
}
