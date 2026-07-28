import { describe, expect, it } from "vitest";
import { isValidTaskStatusTransition, TASK_STATUSES, type TaskStatusValue } from "./status";

describe("isValidTaskStatusTransition", () => {
  it.each(TASK_STATUSES)("accepts %s as a valid target status", (status) => {
    expect(isValidTaskStatusTransition(status)).toBe(true);
  });

  it("rejects a status outside the known set", () => {
    expect(isValidTaskStatusTransition("ARCHIVED" as TaskStatusValue)).toBe(false);
  });
});
