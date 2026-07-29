import { describe, expect, it } from "vitest";
import { findDueInstructions, type InstructionDeadlineCandidate } from "./deadline-scan";

function instruction(overrides: Partial<InstructionDeadlineCandidate> = {}): InstructionDeadlineCandidate {
  return {
    id: "instr-1",
    nextPeriodicDueAt: new Date("2026-08-01T00:00:00Z"),
    lastAlertedForDueAt: null,
    ...overrides,
  };
}

describe("findDueInstructions", () => {
  it("includes an instruction once today enters the 14-day lead window", () => {
    const today = new Date("2026-07-20T00:00:00Z"); // 12 days before due, inside 14-day window
    expect(findDueInstructions([instruction()], today)).toHaveLength(1);
  });

  it("excludes an instruction outside the lead window", () => {
    const today = new Date("2026-07-01T00:00:00Z"); // a month before due
    expect(findDueInstructions([instruction()], today)).toHaveLength(0);
  });

  it("excludes an instruction already alerted for this due-date cycle", () => {
    const today = new Date("2026-07-20T00:00:00Z");
    const due = findDueInstructions(
      [instruction({ lastAlertedForDueAt: new Date("2026-08-01T00:00:00Z") })],
      today,
    );
    expect(due).toHaveLength(0);
  });

  it("excludes an instruction with no next periodic due date (non-repeating types)", () => {
    const today = new Date("2026-07-20T00:00:00Z");
    const due = findDueInstructions([instruction({ nextPeriodicDueAt: null })], today);
    expect(due).toHaveLength(0);
  });

  it("respects a custom lead window", () => {
    const today = new Date("2026-07-25T00:00:00Z"); // 7 days before due
    expect(findDueInstructions([instruction()], today, 7)).toHaveLength(1);
    expect(findDueInstructions([instruction()], today, 3)).toHaveLength(0);
  });
});
