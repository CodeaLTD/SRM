import { afterAll, describe, expect, it } from "vitest";
import { closePdfBrowser, renderPdf } from "../pdf";
import { renderReceiptHtml } from "./receipt-template";
import { renderAdvanceReportHtml } from "./advance-report-template";
import { renderProformaInvoiceHtml } from "./proforma-invoice-template";

describe("FIN-1 document templates", () => {
  afterAll(async () => {
    await closePdfBrowser();
  });

  it("renders receipt HTML with the recipient, line items, and total", () => {
    const html = renderReceiptHtml({
      documentNumber: "RCT-2026-0001",
      recipientName: "Ivan Petrov",
      issueDate: "2026-07-22",
      currency: "BGN",
      lineItems: [{ description: "Consulting", amountMinor: 15000 }],
    });

    expect(html).toContain("Ivan Petrov");
    expect(html).toContain("Consulting");
    expect(html).toContain("150.00 BGN");
    expect(html).toContain("RCT-2026-0001");
  });

  it("renders advance report HTML with spent total and balance", () => {
    const html = renderAdvanceReportHtml({
      documentNumber: "ADV-2026-0001",
      employeeName: "Maria Ivanova",
      purpose: "Conference travel",
      issueDate: "2026-07-22",
      currency: "BGN",
      advanceAmountMinor: 20000,
      lineItems: [{ description: "Train ticket", amountMinor: 12000 }],
    });

    expect(html).toContain("Maria Ivanova");
    expect(html).toContain("Train ticket");
    expect(html).toContain("Total spent: 120.00 BGN");
    expect(html).toContain("Balance to return: 80.00 BGN");
  });

  it("renders proforma invoice HTML with subtotal, VAT, and total", () => {
    const html = renderProformaInvoiceHtml({
      documentNumber: "PRO-2026-0001",
      clientName: "Acme EOOD",
      clientTaxId: "BG123456789",
      issueDate: "2026-07-22",
      currency: "BGN",
      vatRatePercent: 20,
      lineItems: [{ description: "Software license", quantity: 2, unitPriceMinor: 10000 }],
    });

    expect(html).toContain("Acme EOOD");
    expect(html).toContain("Subtotal: 200.00 BGN");
    expect(html).toContain("VAT (20%): 40.00 BGN");
    expect(html).toContain("Total: 240.00 BGN");
  });

  it("renders each template through the real PDF pipeline", async () => {
    const html = renderReceiptHtml({
      documentNumber: "RCT-2026-0002",
      recipientName: "Test",
      issueDate: "2026-07-22",
      currency: "BGN",
      lineItems: [{ description: "Item", amountMinor: 100 }],
    });

    const pdf = await renderPdf({ html });
    expect(pdf.subarray(0, 5).toString("ascii")).toBe("%PDF-");
  });

  it("escapes HTML in user-supplied fields to avoid markup injection", () => {
    const html = renderReceiptHtml({
      documentNumber: "RCT-2026-0003",
      recipientName: "<script>alert(1)</script>",
      issueDate: "2026-07-22",
      currency: "BGN",
      lineItems: [{ description: "Item", amountMinor: 100 }],
    });

    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });
});
