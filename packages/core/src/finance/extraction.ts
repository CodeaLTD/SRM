export interface ExtractedInvoiceFields {
  supplierName?: string;
  supplierTaxId?: string;
  amountMinor?: number;
  vatAmountMinor?: number;
  issueDate?: Date;
  currency?: string;
}

export interface InvoiceFile {
  buffer: Buffer;
  mimeType: string;
}

/**
 * FIN-3 seam — deliberately unimplemented (see docs/plans/01-finance-and-documents.md
 * §10, scoped out for this delivery). Always returns an empty object, so
 * every uploaded supplier invoice starts a "За проверка" transaction with
 * every field blank and a human fills them in by hand (FIN-4/5 shell).
 *
 * A future OCR epic only has to replace this function's body with a real
 * Document AI / OpenAI call — the upload -> FOR_REVIEW -> review/confirm
 * workflow, schema, and UI stay exactly as they are.
 */
export async function extractInvoiceFields(_file: InvoiceFile): Promise<ExtractedInvoiceFields> {
  return {};
}
