import { describe, expect, it } from "vitest";
import { buildMimeMessage } from "../../src/google/gmail";

function decodeMessage(base64url: string): string {
  return Buffer.from(base64url, "base64url").toString("utf-8");
}

// Regression tests for the code-review finding: the original hand-rolled
// MIME builder interpolated to/subject/filename directly into raw header
// lines with no sanitization or encoding. These prove the MailComposer-based
// replacement actually closes both gaps, not just that it compiles.
describe("buildMimeMessage", () => {
  it("does not let a CRLF in the subject inject an extra header", async () => {
    const injected = "Legit subject\r\nBcc: attacker@evil.example";
    const raw = await buildMimeMessage({
      to: "employee@codea.bg",
      subject: injected,
      html: "<p>hello</p>",
    });

    const decoded = decodeMessage(raw);
    // A successful injection would produce a real, unfolded "Bcc:" header
    // line of its own. MailComposer either strips/folds the CRLF or
    // RFC-2047-encodes the whole subject as one opaque token — either way,
    // "Bcc:" must not appear as its own header line.
    const headerLines = decoded.split(/\r\n(?!\s)/);
    const bccHeaderLines = headerLines.filter((line) => /^Bcc:/i.test(line));
    expect(bccHeaderLines).toHaveLength(0);
  });

  it("does not let a CRLF in the recipient inject an extra header", async () => {
    const injected = "employee@codea.bg\r\nBcc: attacker@evil.example";
    const raw = await buildMimeMessage({
      to: injected,
      subject: "Legit subject",
      html: "<p>hello</p>",
    });

    const decoded = decodeMessage(raw);
    const headerLines = decoded.split(/\r\n(?!\s)/);
    const bccHeaderLines = headerLines.filter((line) => /^Bcc:/i.test(line));
    expect(bccHeaderLines).toHaveLength(0);
  });

  it("encodes a non-ASCII (Cyrillic) subject instead of sending it raw", async () => {
    const raw = await buildMimeMessage({
      to: "employee@codea.bg",
      subject: "Одобрен авансов отчет",
      html: "<p>hello</p>",
    });

    const decoded = decodeMessage(raw);
    const subjectLine = decoded.split("\r\n").find((line) => line.startsWith("Subject:"));

    expect(subjectLine).toBeDefined();
    // RFC 2047 encoded-word form: =?charset?B?...?= or ?Q?...?=. Raw
    // Cyrillic bytes sitting unencoded in a header is exactly the bug being
    // fixed here.
    expect(subjectLine).toMatch(/=\?UTF-8\?[BQ]\?/i);
    expect(subjectLine).not.toContain("Одобрен");
  });
});
