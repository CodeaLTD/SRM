import { escapeHtml, formatMinorAmount, renderDocumentShell } from "./shared";

export interface ProformaInvoiceLineItem {
  description: string;
  quantity: number;
  unitPriceMinor: number;
}

export interface ProformaInvoicePayload {
  documentNumber: string;
  clientName: string;
  clientTaxId?: string;
  issueDate: string;
  dueDate?: string;
  currency: string;
  vatRatePercent: number;
  lineItems: ProformaInvoiceLineItem[];
}

export function renderProformaInvoiceHtml(payload: ProformaInvoicePayload): string {
  const subtotal = payload.lineItems.reduce((sum, item) => sum + item.quantity * item.unitPriceMinor, 0);
  const vat = Math.round((subtotal * payload.vatRatePercent) / 100);
  const total = subtotal + vat;

  const rows = payload.lineItems
    .map(
      (item) => `<tr>
        <td>${escapeHtml(item.description)}</td>
        <td>${item.quantity}</td>
        <td>${formatMinorAmount(item.unitPriceMinor, payload.currency)}</td>
        <td>${formatMinorAmount(item.quantity * item.unitPriceMinor, payload.currency)}</td>
      </tr>`,
    )
    .join("");

  const bodyHtml = `
<p><strong>Client:</strong> ${escapeHtml(payload.clientName)}${payload.clientTaxId ? ` (${escapeHtml(payload.clientTaxId)})` : ""}</p>
<p><strong>Issue date:</strong> ${escapeHtml(payload.issueDate)}${payload.dueDate ? ` &nbsp; <strong>Due:</strong> ${escapeHtml(payload.dueDate)}` : ""}</p>
<table>
  <thead><tr><th>Description</th><th>Qty</th><th>Unit price</th><th>Total</th></tr></thead>
  <tbody>${rows}</tbody>
</table>
<p class="totals">Subtotal: ${formatMinorAmount(subtotal, payload.currency)}</p>
<p class="totals">VAT (${payload.vatRatePercent}%): ${formatMinorAmount(vat, payload.currency)}</p>
<p class="totals">Total: ${formatMinorAmount(total, payload.currency)}</p>`;

  return renderDocumentShell({ title: "Proforma Invoice", documentNumber: payload.documentNumber, bodyHtml });
}
