/** Shared layout/formatting helpers for the FIN-1 branded HTML templates. */

export function formatMinorAmount(amountMinor: number, currency: string): string {
  return `${(amountMinor / 100).toFixed(2)} ${currency}`;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Wraps a document body in the shared letterhead/print layout every FIN-1 template uses. */
export function renderDocumentShell(options: { title: string; documentNumber: string; bodyHtml: string }): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  body { font-family: Arial, Helvetica, sans-serif; color: #1a1a1a; font-size: 12px; }
  header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1a1a1a; padding-bottom: 8px; margin-bottom: 16px; }
  h1 { font-size: 18px; margin: 0; }
  .document-number { font-size: 12px; color: #555; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; }
  th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
  th { background: #f2f2f2; }
  .totals { margin-top: 12px; text-align: right; font-weight: bold; }
</style>
</head>
<body>
<header>
  <div>
    <h1>Codea SRM</h1>
  </div>
  <div>
    <div>${escapeHtml(options.title)}</div>
    <div class="document-number">№ ${escapeHtml(options.documentNumber)}</div>
  </div>
</header>
${options.bodyHtml}
</body>
</html>`;
}
