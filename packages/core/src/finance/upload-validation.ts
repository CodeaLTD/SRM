/**
 * Server-side guard for supplier-invoice uploads (FIN-4). The `<input
 * accept>` attribute on the upload form is a UX hint only and is
 * trivially bypassed by posting the multipart form directly, so every
 * upload must be re-validated here before it's written to disk or
 * served back — an unvalidated MIME type stored verbatim and later
 * served with `Content-Type` taken from that same value is a stored-XSS
 * vector (see the download route, which additionally re-checks this
 * allow-list before serving).
 */
export const ALLOWED_SUPPLIER_INVOICE_MIME_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
]);

export const MAX_SUPPLIER_INVOICE_SIZE_BYTES = 20 * 1024 * 1024; // 20MB

export class InvalidUploadError extends Error {}

/** Throws InvalidUploadError if the file's declared type or size is outside what the review flow accepts. */
export function assertValidSupplierInvoiceFile(input: { mimeType: string; sizeBytes: number }): void {
  if (!ALLOWED_SUPPLIER_INVOICE_MIME_TYPES.has(input.mimeType)) {
    throw new InvalidUploadError(`Unsupported file type: ${input.mimeType || "(unknown)"}`);
  }
  if (input.sizeBytes > MAX_SUPPLIER_INVOICE_SIZE_BYTES) {
    throw new InvalidUploadError(
      `File is too large — max ${MAX_SUPPLIER_INVOICE_SIZE_BYTES / (1024 * 1024)}MB`,
    );
  }
}
