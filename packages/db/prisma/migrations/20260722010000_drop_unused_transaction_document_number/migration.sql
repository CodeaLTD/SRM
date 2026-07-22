-- Transaction.documentNumber was never written or read anywhere — it was
-- confused with GeneratedDocument.documentNumber, which is the field
-- actually used by FIN-1's sequential numbering (numbering.ts).
ALTER TABLE "transactions" DROP COLUMN "documentNumber";
