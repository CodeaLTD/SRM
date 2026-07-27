"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  assertCan,
  assertValidSupplierInvoiceFile,
  extractInvoiceFields,
  nextDocumentNumber,
  recordAuditEntry,
  renderAdvanceReportHtml,
  renderPdf,
  renderProformaInvoiceHtml,
  renderReceiptHtml,
  saveFile,
  suggestCategory,
  type ReceiptLineItem,
} from "@codea-srm/core";
import { prisma, TransactionStatus, TransactionType, type DocumentType, type Role } from "@codea-srm/db";
import { requireSession } from "../_lib/session";
import { parseMinorAmount } from "./_lib/money";

// ---- Transactions (FIN-2, FIN-4/5 shell) -----------------------------

export async function createTransaction(formData: FormData): Promise<void> {
  const { userId, role } = await requireSession();
  assertCan(role, "finance:write");

  const type = formData.get("type") as TransactionType;
  const description = (formData.get("description") as string) || undefined;
  const supplierName = (formData.get("supplierName") as string) || undefined;
  const currency = (formData.get("currency") as string) || "BGN";
  const amountMinor = parseMinorAmount(formData.get("amount") as string);
  const issueDate = new Date(formData.get("issueDate") as string);
  const category = suggestCategory({ type, description, supplierName });

  const transaction = await prisma.transaction.create({
    data: {
      type,
      status: TransactionStatus.CONFIRMED,
      category,
      description,
      supplierName,
      currency,
      amountMinor,
      issueDate,
      createdById: userId,
      confirmedById: userId,
      confirmedAt: new Date(),
    },
  });

  await recordAuditEntry({
    actorId: userId,
    actorRole: role,
    action: "transaction.create",
    resource: "Transaction",
    resourceId: transaction.id,
  });

  revalidatePath("/finance");
  redirect("/finance");
}

export async function uploadSupplierInvoice(formData: FormData): Promise<void> {
  const { userId, role } = await requireSession();
  assertCan(role, "finance:write");

  const file = formData.get("file") as File;
  if (!file || file.size === 0) {
    throw new Error("A file is required");
  }
  // Re-validate server-side — the <input accept> the form uses is a UX
  // hint only and doesn't stop a spoofed Content-Type reaching here.
  assertValidSupplierInvoiceFile({ mimeType: file.type, sizeBytes: file.size });
  const buffer = Buffer.from(await file.arrayBuffer());

  const { storageKey, sizeBytes } = await saveFile({
    buffer,
    originalName: file.name,
    mimeType: file.type,
    category: "uploads",
  });

  const uploadedDocument = await prisma.uploadedDocument.create({
    data: {
      documentType: "SUPPLIER_INVOICE_UPLOAD",
      storageKey,
      originalName: file.name,
      mimeType: file.type,
      sizeBytes,
      uploadedById: userId,
    },
  });

  // FIN-3 seam: always returns {} today, so every field below starts
  // blank and a reviewer fills it in by hand (FIN-4/5 shell).
  const extracted = await extractInvoiceFields({ buffer, mimeType: file.type });

  const transaction = await prisma.transaction.create({
    data: {
      type: TransactionType.EXPENSE,
      status: TransactionStatus.FOR_REVIEW,
      supplierName: extracted.supplierName,
      supplierTaxId: extracted.supplierTaxId,
      amountMinor: extracted.amountMinor,
      vatAmountMinor: extracted.vatAmountMinor,
      issueDate: extracted.issueDate,
      currency: extracted.currency ?? "BGN",
      createdById: userId,
      sourceDocumentId: uploadedDocument.id,
    },
  });

  await recordAuditEntry({
    actorId: userId,
    actorRole: role,
    action: "transaction.upload",
    resource: "Transaction",
    resourceId: transaction.id,
  });

  revalidatePath("/finance");
  redirect(`/finance/transactions/${transaction.id}`);
}

export async function updateTransactionDraft(id: string, formData: FormData): Promise<void> {
  const { userId, role } = await requireSession();
  assertCan(role, "finance:write");

  const transaction = await prisma.transaction.findUniqueOrThrow({ where: { id } });
  if (transaction.status !== TransactionStatus.FOR_REVIEW) {
    throw new Error("Only transactions awaiting review can be edited this way");
  }

  const amountRaw = formData.get("amount") as string;
  const vatRaw = formData.get("vatAmount") as string;
  const issueDateRaw = formData.get("issueDate") as string;

  await prisma.transaction.update({
    where: { id },
    data: {
      supplierName: (formData.get("supplierName") as string) || null,
      supplierTaxId: (formData.get("supplierTaxId") as string) || null,
      amountMinor: amountRaw ? parseMinorAmount(amountRaw) : null,
      vatAmountMinor: vatRaw ? parseMinorAmount(vatRaw) : null,
      issueDate: issueDateRaw ? new Date(issueDateRaw) : null,
      currency: (formData.get("currency") as string) || transaction.currency,
      description: (formData.get("description") as string) || null,
    },
  });

  await recordAuditEntry({
    actorId: userId,
    actorRole: role,
    action: "transaction.update_draft",
    resource: "Transaction",
    resourceId: id,
  });

  revalidatePath(`/finance/transactions/${id}`);
  redirect(`/finance/transactions/${id}`);
}

export async function confirmTransaction(id: string): Promise<void> {
  const { userId, role } = await requireSession();
  assertCan(role, "finance:confirm");

  const transaction = await prisma.transaction.findUniqueOrThrow({ where: { id } });
  if (transaction.status !== TransactionStatus.FOR_REVIEW) {
    throw new Error("Transaction is not awaiting review");
  }
  if (transaction.amountMinor === null || transaction.issueDate === null || !transaction.supplierName) {
    throw new Error("Amount, issue date, and supplier name are required before confirming");
  }

  await prisma.transaction.update({
    where: { id },
    data: { status: TransactionStatus.CONFIRMED, confirmedById: userId, confirmedAt: new Date() },
  });

  await recordAuditEntry({
    actorId: userId,
    actorRole: role,
    action: "transaction.confirm",
    resource: "Transaction",
    resourceId: id,
  });

  revalidatePath("/finance");
  redirect("/finance");
}

export async function voidTransaction(id: string): Promise<void> {
  const { userId, role } = await requireSession();
  assertCan(role, "finance:delete");

  const transaction = await prisma.transaction.findUniqueOrThrow({ where: { id } });
  if (transaction.status === TransactionStatus.VOID) {
    throw new Error("Transaction is already void");
  }

  await prisma.transaction.update({ where: { id }, data: { status: TransactionStatus.VOID } });

  await recordAuditEntry({
    actorId: userId,
    actorRole: role,
    action: "transaction.void",
    resource: "Transaction",
    resourceId: id,
  });

  revalidatePath("/finance");
  redirect("/finance");
}

// ---- Documents (FIN-1) -------------------------------------------------

function collectLineItems(formData: FormData, rows: number): ReceiptLineItem[] {
  const items: ReceiptLineItem[] = [];
  for (let i = 0; i < rows; i++) {
    const description = formData.get(`item${i}_description`) as string | null;
    const amountRaw = formData.get(`item${i}_amount`) as string | null;
    if (description && amountRaw) {
      items.push({ description, amountMinor: parseMinorAmount(amountRaw) });
    }
  }
  return items;
}

export async function generateReceipt(formData: FormData): Promise<void> {
  const { userId, role } = await requireSession();
  assertCan(role, "finance:write");

  const documentNumber = await nextDocumentNumber("RECEIPT");
  const payload = {
    documentNumber,
    recipientName: formData.get("recipientName") as string,
    issueDate: formData.get("issueDate") as string,
    currency: (formData.get("currency") as string) || "BGN",
    lineItems: collectLineItems(formData, 5),
  };

  const html = renderReceiptHtml(payload);
  await persistGeneratedDocument({ documentType: "RECEIPT", documentNumber, payload, html, userId, role });

  revalidatePath("/finance/documents");
  redirect("/finance/documents");
}

export async function generateAdvanceReport(formData: FormData): Promise<void> {
  const { userId, role } = await requireSession();
  assertCan(role, "finance:write");

  const documentNumber = await nextDocumentNumber("ADVANCE_REPORT");
  const payload = {
    documentNumber,
    employeeName: formData.get("employeeName") as string,
    purpose: formData.get("purpose") as string,
    issueDate: formData.get("issueDate") as string,
    currency: (formData.get("currency") as string) || "BGN",
    advanceAmountMinor: parseMinorAmount(formData.get("advanceAmount") as string),
    lineItems: collectLineItems(formData, 5),
  };

  const html = renderAdvanceReportHtml(payload);
  await persistGeneratedDocument({ documentType: "ADVANCE_REPORT", documentNumber, payload, html, userId, role });

  revalidatePath("/finance/documents");
  redirect("/finance/documents");
}

export async function generateProformaInvoice(formData: FormData): Promise<void> {
  const { userId, role } = await requireSession();
  assertCan(role, "finance:write");

  const documentNumber = await nextDocumentNumber("PROFORMA_INVOICE");
  const lineItems = [];
  for (let i = 0; i < 5; i++) {
    const description = formData.get(`item${i}_description`) as string | null;
    const quantityRaw = formData.get(`item${i}_quantity`) as string | null;
    const unitPriceRaw = formData.get(`item${i}_unitPrice`) as string | null;
    if (description && quantityRaw && unitPriceRaw) {
      lineItems.push({
        description,
        quantity: Number.parseFloat(quantityRaw),
        unitPriceMinor: parseMinorAmount(unitPriceRaw),
      });
    }
  }

  const payload = {
    documentNumber,
    clientName: formData.get("clientName") as string,
    clientTaxId: (formData.get("clientTaxId") as string) || undefined,
    issueDate: formData.get("issueDate") as string,
    dueDate: (formData.get("dueDate") as string) || undefined,
    currency: (formData.get("currency") as string) || "BGN",
    vatRatePercent: Number.parseFloat((formData.get("vatRatePercent") as string) || "20"),
    lineItems,
  };

  const html = renderProformaInvoiceHtml(payload);
  await persistGeneratedDocument({ documentType: "PROFORMA_INVOICE", documentNumber, payload, html, userId, role });

  revalidatePath("/finance/documents");
  redirect("/finance/documents");
}

async function persistGeneratedDocument(input: {
  documentType: DocumentType;
  documentNumber: string;
  payload: unknown;
  html: string;
  userId: string;
  role: Role;
}): Promise<void> {
  const pdf = await renderPdf({ html: input.html });
  const { storageKey } = await saveFile({
    buffer: pdf,
    originalName: `${input.documentNumber}.pdf`,
    mimeType: "application/pdf",
    category: "generated",
  });

  const document = await prisma.generatedDocument.create({
    data: {
      documentType: input.documentType,
      documentNumber: input.documentNumber,
      payload: input.payload as never,
      storageKey,
      createdById: input.userId,
    },
  });

  await recordAuditEntry({
    actorId: input.userId,
    actorRole: input.role,
    action: "document.generate",
    resource: "GeneratedDocument",
    resourceId: document.id,
  });
}

// ---- Subscriptions (FIN-6/7) -------------------------------------------

/** billingIntervalDays must be positive — rollRenewalForward would infinite-loop on 0/negative (see packages/core/src/finance/subscription-renewal.ts). */
function parseBillingIntervalDays(formData: FormData): number {
  const days = Number.parseInt((formData.get("billingIntervalDays") as string) || "30", 10);
  if (!Number.isInteger(days) || days < 1) {
    throw new Error("Billing interval must be a positive number of days");
  }
  return days;
}

export async function createSubscription(formData: FormData): Promise<void> {
  const { userId, role } = await requireSession();
  assertCan(role, "finance:write");

  const subscription = await prisma.subscription.create({
    data: {
      name: formData.get("name") as string,
      url: (formData.get("url") as string) || undefined,
      vendor: (formData.get("vendor") as string) || undefined,
      feeAmountMinor: parseMinorAmount(formData.get("feeAmount") as string),
      currency: formData.get("currency") as string,
      billingIntervalDays: parseBillingIntervalDays(formData),
      renewsAt: new Date(formData.get("renewsAt") as string),
      alertLeadDays: Number.parseInt((formData.get("alertLeadDays") as string) || "7", 10),
      ownerId: userId,
    },
  });

  await recordAuditEntry({
    actorId: userId,
    actorRole: role,
    action: "subscription.create",
    resource: "Subscription",
    resourceId: subscription.id,
  });

  revalidatePath("/finance/subscriptions");
  redirect("/finance/subscriptions");
}

export async function updateSubscription(id: string, formData: FormData): Promise<void> {
  const { userId, role } = await requireSession();
  assertCan(role, "finance:write");

  await prisma.subscription.update({
    where: { id },
    data: {
      name: formData.get("name") as string,
      url: (formData.get("url") as string) || null,
      vendor: (formData.get("vendor") as string) || null,
      feeAmountMinor: parseMinorAmount(formData.get("feeAmount") as string),
      currency: formData.get("currency") as string,
      billingIntervalDays: parseBillingIntervalDays(formData),
      renewsAt: new Date(formData.get("renewsAt") as string),
      alertLeadDays: Number.parseInt((formData.get("alertLeadDays") as string) || "7", 10),
    },
  });

  await recordAuditEntry({
    actorId: userId,
    actorRole: role,
    action: "subscription.update",
    resource: "Subscription",
    resourceId: id,
  });

  revalidatePath("/finance/subscriptions");
  redirect("/finance/subscriptions");
}

export async function unsubscribe(id: string): Promise<void> {
  const { userId, role } = await requireSession();
  assertCan(role, "finance:delete");

  await prisma.subscription.update({ where: { id }, data: { unsubscribedAt: new Date() } });

  await recordAuditEntry({
    actorId: userId,
    actorRole: role,
    action: "subscription.unsubscribe",
    resource: "Subscription",
    resourceId: id,
  });

  revalidatePath("/finance/subscriptions");
  redirect("/finance/subscriptions");
}
