import { describe, expect, it } from "vitest";
import { isValidTaskStatusTransition, TASK_STATUSES, taskDeadlineToEventWindow, type TaskStatusValue } from "./status";

describe("isValidTaskStatusTransition", () => {
  it.each(TASK_STATUSES)("accepts %s as a valid target status", (status) => {
    expect(isValidTaskStatusTransition(status)).toBe(true);
  });

  it("rejects a status outside the known set", () => {
    expect(isValidTaskStatusTransition("ARCHIVED" as TaskStatusValue)).toBe(false);
  });
});

describe("taskDeadlineToEventWindow", () => {
  it("spans the full UTC day the deadline falls on", () => {
    const { startIso, endIso } = taskDeadlineToEventWindow(new Date("2026-08-15T14:32:00.000Z"));
    expect(startIso).toBe("2026-08-15T00:00:00.000Z");
    expect(endIso).toBe("2026-08-16T00:00:00.000Z");
  });

  it("rolls over the month/year correctly at a boundary", () => {
    const { startIso, endIso } = taskDeadlineToEventWindow(new Date("2026-12-31T09:00:00.000Z"));
    expect(startIso).toBe("2026-12-31T00:00:00.000Z");
    expect(endIso).toBe("2027-01-01T00:00:00.000Z");
  });
});
