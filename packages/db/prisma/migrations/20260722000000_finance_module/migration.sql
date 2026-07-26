-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('FOR_REVIEW', 'CONFIRMED', 'VOID');

-- CreateEnum
CREATE TYPE "TransactionCategory" AS ENUM ('SUPPLIES', 'SOFTWARE_SUBSCRIPTION', 'TRAVEL', 'UTILITIES', 'PROFESSIONAL_SERVICES', 'CLIENT_INCOME', 'OTHER_INCOME', 'OTHER_EXPENSE');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('RECEIPT', 'ADVANCE_REPORT', 'PROFORMA_INVOICE', 'SUPPLIER_INVOICE_UPLOAD');

-- CreateTable
CREATE TABLE "uploaded_documents" (
    "id" TEXT NOT NULL,
    "documentType" "DocumentType" NOT NULL,
    "storageKey" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "uploaded_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'CONFIRMED',
    "category" "TransactionCategory",
    "description" TEXT,
    "supplierName" TEXT,
    "supplierTaxId" TEXT,
    "amountMinor" INTEGER,
    "vatAmountMinor" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'BGN',
    "issueDate" TIMESTAMP(3),
    "documentNumber" TEXT,
    "sourceDocumentId" TEXT,
    "createdById" TEXT NOT NULL,
    "confirmedById" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generated_documents" (
    "id" TEXT NOT NULL,
    "documentType" "DocumentType" NOT NULL,
    "documentNumber" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "storageKey" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "generated_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_sequences" (
    "documentType" "DocumentType" NOT NULL,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,
    "year" INTEGER NOT NULL,

    CONSTRAINT "document_sequences_pkey" PRIMARY KEY ("documentType")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT,
    "vendor" TEXT,
    "feeAmountMinor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "billingIntervalDays" INTEGER NOT NULL DEFAULT 30,
    "renewsAt" TIMESTAMP(3) NOT NULL,
    "alertLeadDays" INTEGER NOT NULL DEFAULT 7,
    "lastAlertedForRenewsAt" TIMESTAMP(3),
    "unsubscribedAt" TIMESTAMP(3),
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "uploaded_documents_documentType_idx" ON "uploaded_documents"("documentType");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_sourceDocumentId_key" ON "transactions"("sourceDocumentId");

-- CreateIndex
CREATE INDEX "transactions_status_idx" ON "transactions"("status");

-- CreateIndex
CREATE INDEX "transactions_type_issueDate_idx" ON "transactions"("type", "issueDate");

-- CreateIndex
CREATE UNIQUE INDEX "generated_documents_documentNumber_key" ON "generated_documents"("documentNumber");

-- CreateIndex
CREATE INDEX "generated_documents_documentType_createdAt_idx" ON "generated_documents"("documentType", "createdAt");

-- CreateIndex
CREATE INDEX "subscriptions_renewsAt_idx" ON "subscriptions"("renewsAt");

-- AddForeignKey
ALTER TABLE "uploaded_documents" ADD CONSTRAINT "uploaded_documents_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "uploaded_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_confirmedById_fkey" FOREIGN KEY ("confirmedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_documents" ADD CONSTRAINT "generated_documents_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
