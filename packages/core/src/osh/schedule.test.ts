import { describe, expect, it } from "vitest";
import { calculateNextPeriodicDueAt } from "./schedule";

describe("calculateNextPeriodicDueAt", () => {
  it("advances a PERIODIC instruction by the default interval", () => {
    const conductedAt = new Date("2026-01-15T00:00:00Z");
    const next = calculateNextPeriodicDueAt("PERIODIC", conductedAt);
    expect(next?.toISOString()).toBe("2027-01-15T00:00:00.000Z");
  });

  it.each(["INITIAL", "WORKPLACE", "EXTRAORDINARY"] as const)(
    "returns null for non-repeating type %s",
    (type) => {
      expect(calculateNextPeriodicDueAt(type, new Date("2026-01-15T00:00:00Z"))).toBeNull();
    },
  );
});
