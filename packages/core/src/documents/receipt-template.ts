import { escapeHtml, formatMinorAmount, renderDocumentShell } from "./shared";

export interface ReceiptLineItem {
  description: string;
  amountMinor: number;
}

export interface ReceiptPayload {
  documentNumber: string;
  recipientName: string;
  issueDate: string;
  currency: string;
  lineItems: ReceiptLineItem[];
}

export function renderReceiptHtml(payload: ReceiptPayload): string {
  const total = payload.lineItems.reduce((sum, item) => sum + item.amountMinor, 0);

  const rows = payload.lineItems
    .map(
      (item) =>
        `<tr><td>${escapeHtml(item.description)}</td><td>${formatMinorAmount(item.amountMinor, payload.currency)}</td></tr>`,
    )
    .join("");

  const bodyHtml = `
<p><strong>Received from:</strong> ${escapeHtml(payload.recipientName)}</p>
<p><strong>Date:</strong> ${escapeHtml(payload.issueDate)}</p>
<table>
  <thead><tr><th>Description</th><th>Amount</th></tr></thead>
  <tbody>${rows}</tbody>
</table>
<p class="totals">Total: ${formatMinorAmount(total, payload.currency)}</p>`;

  return renderDocumentShell({ title: "Receipt", documentNumber: payload.documentNumber, bodyHtml });
}
