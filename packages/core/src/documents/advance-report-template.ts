import { escapeHtml, formatMinorAmount, renderDocumentShell } from "./shared";

export interface AdvanceReportLineItem {
  description: string;
  amountMinor: number;
}

export interface AdvanceReportPayload {
  documentNumber: string;
  employeeName: string;
  purpose: string;
  issueDate: string;
  currency: string;
  advanceAmountMinor: number;
  lineItems: AdvanceReportLineItem[];
}

// авансови отчети (FIN-1) — advance received vs. amount spent/justified.
export function renderAdvanceReportHtml(payload: AdvanceReportPayload): string {
  const spent = payload.lineItems.reduce((sum, item) => sum + item.amountMinor, 0);
  const balance = payload.advanceAmountMinor - spent;

  const rows = payload.lineItems
    .map(
      (item) =>
        `<tr><td>${escapeHtml(item.description)}</td><td>${formatMinorAmount(item.amountMinor, payload.currency)}</td></tr>`,
    )
    .join("");

  const bodyHtml = `
<p><strong>Employee:</strong> ${escapeHtml(payload.employeeName)}</p>
<p><strong>Purpose:</strong> ${escapeHtml(payload.purpose)}</p>
<p><strong>Date:</strong> ${escapeHtml(payload.issueDate)}</p>
<p><strong>Advance received:</strong> ${formatMinorAmount(payload.advanceAmountMinor, payload.currency)}</p>
<table>
  <thead><tr><th>Description</th><th>Amount spent</th></tr></thead>
  <tbody>${rows}</tbody>
</table>
<p class="totals">Total spent: ${formatMinorAmount(spent, payload.currency)}</p>
<p class="totals">Balance ${balance >= 0 ? "to return" : "owed to employee"}: ${formatMinorAmount(Math.abs(balance), payload.currency)}</p>`;

  return renderDocumentShell({ title: "Advance Report", documentNumber: payload.documentNumber, bodyHtml });
}
