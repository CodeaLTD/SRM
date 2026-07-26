import { describe, expect, it } from "vitest";
import { extractInvoiceFields } from "./extraction";

// Documents the FIN-3 seam contract: today this always returns {}, so the
// review form starts fully blank. A future OCR implementation changing
// this return shape is a deliberate, visible diff against this test.
describe("extractInvoiceFields", () => {
  it("returns no extracted fields (OCR intentionally out of scope)", async () => {
    const result = await extractInvoiceFields({ buffer: Buffer.from("fake-pdf"), mimeType: "application/pdf" });
    expect(result).toEqual({});
  });
});
