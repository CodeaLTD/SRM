import { describe, expect, it } from "vitest";
import {
  ALLOWED_SUPPLIER_INVOICE_MIME_TYPES,
  assertValidSupplierInvoiceFile,
  InvalidUploadError,
  MAX_SUPPLIER_INVOICE_SIZE_BYTES,
} from "./upload-validation";

describe("assertValidSupplierInvoiceFile", () => {
  it.each([...ALLOWED_SUPPLIER_INVOICE_MIME_TYPES])("accepts %s within the size limit", (mimeType) => {
    expect(() => assertValidSupplierInvoiceFile({ mimeType, sizeBytes: 1024 })).not.toThrow();
  });

  it("rejects an unlisted MIME type, even one spoofed to look browser-renderable", () => {
    expect(() => assertValidSupplierInvoiceFile({ mimeType: "text/html", sizeBytes: 1024 })).toThrow(
      InvalidUploadError,
    );
    expect(() => assertValidSupplierInvoiceFile({ mimeType: "image/svg+xml", sizeBytes: 1024 })).toThrow(
      InvalidUploadError,
    );
  });

  it("rejects an empty/unknown MIME type", () => {
    expect(() => assertValidSupplierInvoiceFile({ mimeType: "", sizeBytes: 1024 })).toThrow(InvalidUploadError);
  });

  it("rejects a file over the size cap", () => {
    expect(() =>
      assertValidSupplierInvoiceFile({ mimeType: "application/pdf", sizeBytes: MAX_SUPPLIER_INVOICE_SIZE_BYTES + 1 }),
    ).toThrow(InvalidUploadError);
  });

  it("accepts a file exactly at the size cap", () => {
    expect(() =>
      assertValidSupplierInvoiceFile({ mimeType: "application/pdf", sizeBytes: MAX_SUPPLIER_INVOICE_SIZE_BYTES }),
    ).not.toThrow();
  });
});
