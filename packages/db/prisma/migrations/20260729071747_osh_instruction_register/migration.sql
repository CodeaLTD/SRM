-- CreateEnum
CREATE TYPE "InstructionType" AS ENUM ('INITIAL', 'WORKPLACE', 'PERIODIC', 'EXTRAORDINARY');

-- AlterEnum
ALTER TYPE "DocumentType" ADD VALUE 'INSTRUCTION_DECLARATION';

-- CreateTable
CREATE TABLE "instructions" (
    "id" TEXT NOT NULL,
    "type" "InstructionType" NOT NULL,
    "employeeId" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "conductedAt" TIMESTAMP(3) NOT NULL,
    "nextPeriodicDueAt" TIMESTAMP(3),
    "lastAlertedForDueAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "confirmedIp" TEXT,
    "declarationDocumentId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "instructions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "instructions_declarationDocumentId_key" ON "instructions"("declarationDocumentId");

-- CreateIndex
CREATE INDEX "instructions_employeeId_idx" ON "instructions"("employeeId");

-- CreateIndex
CREATE INDEX "instructions_nextPeriodicDueAt_idx" ON "instructions"("nextPeriodicDueAt");

-- AddForeignKey
ALTER TABLE "instructions" ADD CONSTRAINT "instructions_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instructions" ADD CONSTRAINT "instructions_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instructions" ADD CONSTRAINT "instructions_declarationDocumentId_fkey" FOREIGN KEY ("declarationDocumentId") REFERENCES "generated_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instructions" ADD CONSTRAINT "instructions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
