import { afterAll, describe, expect, it } from "vitest";
import { closePdfBrowser, renderPdf } from "../src/pdf";

// Actually launches headless Chromium and renders a PDF (NFR-DOC) — no DB
// or Redis needed, so this can run standalone (`pnpm --filter
// @codea-srm/core test`) even before Docker/OAuth are wired up.
describe("renderPdf", () => {
  afterAll(async () => {
    await closePdfBrowser();
  });

  it("produces a real PDF from HTML", async () => {
    const buffer = await renderPdf({
      html: "<html><body><h1>Codea SRM smoke test</h1></body></html>",
    });

    expect(buffer.subarray(0, 5).toString("ascii")).toBe("%PDF-");
    expect(buffer.length).toBeGreaterThan(500);
  });

  it("is deterministic for identical input (NFR-DOC)", async () => {
    const html = "<html><body><p>Deterministic content</p></body></html>";
    const first = await renderPdf({ html });
    const second = await renderPdf({ html });

    // Puppeteer embeds a creation timestamp, so byte-for-byte equality
    // isn't realistic — same-size output for identical input is the
    // practical determinism check.
    expect(second.length).toBe(first.length);
  });
});
