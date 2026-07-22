import { Prisma, prisma, type DocumentType } from "@codea-srm/db";

/**
 * Simple per-DocumentType sequential numbering (PRD §14 Q4 default —
 * "TYPE-YEAR-NNNN", resets each calendar year). NOT validated against
 * Bulgarian statutory numbering rules (gap-free sequences, mandated
 * format, fiscal-year reset) — flagged for accountant/legal sign-off
 * before this is relied on for real filings.
 */
const NUMBER_PREFIX: Record<DocumentType, string> = {
  RECEIPT: "RCT",
  ADVANCE_REPORT: "ADV",
  PROFORMA_INVOICE: "PRO",
  SUPPLIER_INVOICE_UPLOAD: "SUP",
};

/**
 * Atomic upsert-and-increment via a single SQL statement (not a Prisma
 * read-then-write transaction) so concurrent callers never race each
 * other into issuing the same number — Postgres row-level locking on the
 * UPDATE branch of ON CONFLICT serializes concurrent increments.
 */
export async function nextDocumentNumber(documentType: DocumentType): Promise<string> {
  const year = new Date().getUTCFullYear();

  const rows = await prisma.$queryRaw<{ lastNumber: number }[]>(Prisma.sql`
    INSERT INTO "document_sequences" ("documentType", "year", "lastNumber")
    VALUES (${documentType}::"DocumentType", ${year}, 1)
    ON CONFLICT ("documentType") DO UPDATE SET
      "lastNumber" = CASE
        WHEN "document_sequences"."year" = ${year} THEN "document_sequences"."lastNumber" + 1
        ELSE 1
      END,
      "year" = ${year}
    RETURNING "lastNumber"
  `);

  const lastNumber = rows[0]?.lastNumber ?? 1;
  return `${NUMBER_PREFIX[documentType]}-${year}-${String(lastNumber).padStart(4, "0")}`;
}
