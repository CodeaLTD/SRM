import { describe, expect, it } from "vitest";
import type { TransactionCategory, TransactionType } from "@codea-srm/db";
import { suggestCategory } from "./categorization";

describe("suggestCategory", () => {
  it.each<[TransactionType, string | undefined, string | undefined, TransactionCategory]>([
    ["INCOME", "Client project payment", undefined, "CLIENT_INCOME"],
    ["EXPENSE", "Monthly AWS bill", undefined, "SOFTWARE_SUBSCRIPTION"],
    ["EXPENSE", undefined, "Adobe Inc.", "SOFTWARE_SUBSCRIPTION"],
    ["EXPENSE", "Hotel stay for conference", undefined, "TRAVEL"],
    ["EXPENSE", "Office чист supplies", undefined, "SUPPLIES"],
    ["EXPENSE", "Something entirely unrelated", undefined, "OTHER_EXPENSE"],
  ])("type=%s description=%s supplier=%s -> %s", (type, description, supplierName, expected) => {
    expect(suggestCategory({ type, description, supplierName })).toBe(expected);
  });
});
