import puppeteer, { type Browser } from "puppeteer";

let browserPromise: Promise<Browser> | undefined;

/**
 * One headless Chromium instance shared across renders within a process,
 * rather than launching per-call — launch cost dwarfs render cost.
 * apps/worker owns the process lifetime for anything non-trivial in size
 * (NFR-PERF); apps/web should only call this for small, fast documents.
 */
function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }
  return browserPromise;
}

export interface RenderPdfOptions {
  /** Fully-rendered HTML — callers render their own template (React/HTML) to a string first. */
  html: string;
  /** Passed through to Puppeteer's page.pdf(); defaults to A4 with 15mm margins for branded documents. */
  pdfOptions?: Parameters<Awaited<ReturnType<Browser["newPage"]>>["pdf"]>[0];
}

/**
 * Deterministic HTML -> PDF (NFR-DOC: same input, same output). Used by
 * finance (receipts/proforma invoices), hr (CV export), osh (compliance
 * declarations) via their own template-rendering step feeding in here —
 * this function never knows about module-specific data shapes.
 */
export async function renderPdf({ html, pdfOptions }: RenderPdfOptions): Promise<Buffer> {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({
      format: "A4",
      margin: { top: "15mm", bottom: "15mm", left: "15mm", right: "15mm" },
      printBackground: true,
      ...pdfOptions,
    });
    return Buffer.from(pdf);
  } finally {
    await page.close();
  }
}

/** Call from process shutdown handlers (apps/worker, apps/web custom server) to release Chromium cleanly. */
export async function closePdfBrowser(): Promise<void> {
  if (browserPromise) {
    const browser = await browserPromise;
    await browser.close();
    browserPromise = undefined;
  }
}
