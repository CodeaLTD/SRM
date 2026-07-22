import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@codea-srm/db";
import { nextDocumentNumber } from "./numbering";

// Requires a live Postgres (DATABASE_URL) — the one place a real
// concurrency bug in the sequential-numbering logic (PRD §14 Q4) could
// hide, so this is worth an actual DB round-trip rather than a pure-unit
// stand-in.
describe("nextDocumentNumber", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("never hands out the same number to concurrent callers", async () => {
    const results = await Promise.all(Array.from({ length: 10 }, () => nextDocumentNumber("RECEIPT")));
    expect(new Set(results).size).toBe(10);
  });

  it("formats as PREFIX-YEAR-NNNN", async () => {
    const number = await nextDocumentNumber("PROFORMA_INVOICE");
    expect(number).toMatch(/^PRO-\d{4}-\d{4}$/);
  });

  it("increments monotonically per document type", async () => {
    const first = await nextDocumentNumber("ADVANCE_REPORT");
    const second = await nextDocumentNumber("ADVANCE_REPORT");
    const firstN = Number.parseInt(first.slice(first.lastIndexOf("-") + 1), 10);
    const secondN = Number.parseInt(second.slice(second.lastIndexOf("-") + 1), 10);
    expect(secondN).toBe(firstN + 1);
  });
});
