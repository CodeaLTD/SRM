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
