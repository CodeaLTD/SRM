import { describe, expect, it } from "vitest";
import { isValidLeavePeriod, overlapsExistingLeave, type LeavePeriodCandidate } from "./leave-period";

function leaveRequest(overrides: Partial<LeavePeriodCandidate> = {}): LeavePeriodCandidate {
  return {
    id: "leave-1",
    startDate: new Date("2026-08-10T00:00:00Z"),
    endDate: new Date("2026-08-14T00:00:00Z"),
    status: "PENDING",
    ...overrides,
  };
}

describe("isValidLeavePeriod", () => {
  it("accepts endDate after startDate", () => {
    expect(isValidLeavePeriod(new Date("2026-08-01T00:00:00Z"), new Date("2026-08-05T00:00:00Z"))).toBe(true);
  });

  it("accepts a single-day leave (endDate === startDate)", () => {
    const day = new Date("2026-08-01T00:00:00Z");
    expect(isValidLeavePeriod(day, day)).toBe(true);
  });

  it("rejects endDate before startDate", () => {
    expect(isValidLeavePeriod(new Date("2026-08-05T00:00:00Z"), new Date("2026-08-01T00:00:00Z"))).toBe(false);
  });
});

describe("overlapsExistingLeave", () => {
  it("returns false for a non-overlapping candidate", () => {
    const candidate = { startDate: new Date("2026-08-20T00:00:00Z"), endDate: new Date("2026-08-22T00:00:00Z") };
    expect(overlapsExistingLeave(candidate, [leaveRequest()])).toBe(false);
  });

  it("returns true for an exact-match overlap", () => {
    const candidate = { startDate: new Date("2026-08-10T00:00:00Z"), endDate: new Date("2026-08-14T00:00:00Z") };
    expect(overlapsExistingLeave(candidate, [leaveRequest()])).toBe(true);
  });

  it("returns true for a partial overlap (starts inside, ends outside)", () => {
    const candidate = { startDate: new Date("2026-08-12T00:00:00Z"), endDate: new Date("2026-08-18T00:00:00Z") };
    expect(overlapsExistingLeave(candidate, [leaveRequest()])).toBe(true);
  });

  it("returns false when adjacent but not overlapping (candidate starts the day after existing ends)", () => {
    const candidate = { startDate: new Date("2026-08-15T00:00:00Z"), endDate: new Date("2026-08-17T00:00:00Z") };
    expect(overlapsExistingLeave(candidate, [leaveRequest()])).toBe(false);
  });

  it.each(["REJECTED", "CANCELLED"] as const)("does not block against a %s existing request", (status) => {
    const candidate = { startDate: new Date("2026-08-10T00:00:00Z"), endDate: new Date("2026-08-14T00:00:00Z") };
    expect(overlapsExistingLeave(candidate, [leaveRequest({ status })])).toBe(false);
  });

  it.each(["PENDING", "APPROVED"] as const)("blocks against a %s existing request", (status) => {
    const candidate = { startDate: new Date("2026-08-10T00:00:00Z"), endDate: new Date("2026-08-14T00:00:00Z") };
    expect(overlapsExistingLeave(candidate, [leaveRequest({ status })])).toBe(true);
  });
});
