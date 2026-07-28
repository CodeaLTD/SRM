import { describe, expect, it } from "vitest";
import { parseTags } from "./tags";

describe("parseTags", () => {
  it("splits and trims comma-separated tags", () => {
    expect(parseTags("key client,  potential partner ,vendor")).toEqual([
      "key client",
      "potential partner",
      "vendor",
    ]);
  });

  it("drops empty entries from stray commas", () => {
    expect(parseTags("key client,,  ,vendor")).toEqual(["key client", "vendor"]);
  });

  it("dedupes case-insensitively, keeping the first-seen casing", () => {
    expect(parseTags("vendor, vendor, Vendor")).toEqual(["vendor"]);
    expect(parseTags("Vendor, vendor")).toEqual(["Vendor"]);
  });

  it("returns an empty array for blank input", () => {
    expect(parseTags("")).toEqual([]);
    expect(parseTags("   ")).toEqual([]);
  });
});
