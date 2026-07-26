import { describe, expect, it } from "vitest";
import { findDueSubscriptions, rollRenewalForward, type SubscriptionRenewalCandidate } from "./subscription-renewal";

function subscription(overrides: Partial<SubscriptionRenewalCandidate> = {}): SubscriptionRenewalCandidate {
  return {
    id: "sub-1",
    renewsAt: new Date("2026-08-01T00:00:00Z"),
    alertLeadDays: 7,
    lastAlertedForRenewsAt: null,
    unsubscribedAt: null,
    ...overrides,
  };
}

describe("findDueSubscriptions", () => {
  it("includes a subscription once today enters the alert lead window", () => {
    const today = new Date("2026-07-26T00:00:00Z"); // 6 days before renewsAt, inside 7-day window
    expect(findDueSubscriptions([subscription()], today)).toHaveLength(1);
  });

  it("excludes a subscription outside the alert lead window", () => {
    const today = new Date("2026-07-01T00:00:00Z"); // a month before renewsAt
    expect(findDueSubscriptions([subscription()], today)).toHaveLength(0);
  });

  it("excludes a subscription already alerted for this renewsAt cycle", () => {
    const today = new Date("2026-07-26T00:00:00Z");
    const due = findDueSubscriptions(
      [subscription({ lastAlertedForRenewsAt: new Date("2026-08-01T00:00:00Z") })],
      today,
    );
    expect(due).toHaveLength(0);
  });

  it("excludes an unsubscribed subscription", () => {
    const today = new Date("2026-07-26T00:00:00Z");
    const due = findDueSubscriptions([subscription({ unsubscribedAt: new Date("2026-07-20T00:00:00Z") })], today);
    expect(due).toHaveLength(0);
  });
});

describe("rollRenewalForward", () => {
  it("advances renewsAt by billing cycles until it is after today", () => {
    const renewsAt = new Date("2026-07-01T00:00:00Z");
    const today = new Date("2026-07-15T00:00:00Z");
    const next = rollRenewalForward(renewsAt, 30, today);
    expect(next.toISOString()).toBe("2026-07-31T00:00:00.000Z");
  });

  it.each([0, -1, -30])("rejects a non-positive billingIntervalDays (%i) instead of looping forever", (days) => {
    const renewsAt = new Date("2026-07-01T00:00:00Z");
    const today = new Date("2026-07-15T00:00:00Z");
    expect(() => rollRenewalForward(renewsAt, days, today)).toThrow(/positive/);
  });
});
