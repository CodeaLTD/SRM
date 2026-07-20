import { google } from "googleapis";
import { createGoogleClient } from "./client";

export interface SendGmailInput {
  to: string;
  subject: string;
  html: string;
  attachments?: { filename: string; content: Buffer; contentType: string }[];
  /** Service-account/company sender's stored refresh token. Defaults to a shared company mailbox token if omitted — TODO once GoogleToken lookup is wired in. */
  refreshToken?: string;
}

function buildMimeMessage(input: SendGmailInput): string {
  const boundary = `srm-${Date.now()}`;
  const parts = [
    `To: ${input.to}`,
    `Subject: ${input.subject}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "",
    input.html,
  ];

  for (const attachment of input.attachments ?? []) {
    parts.push(
      `--${boundary}`,
      `Content-Type: ${attachment.contentType}`,
      "Content-Transfer-Encoding: base64",
      `Content-Disposition: attachment; filename="${attachment.filename}"`,
      "",
      attachment.content.toString("base64"),
    );
  }

  parts.push(`--${boundary}--`);
  return Buffer.from(parts.join("\r\n")).toString("base64url");
}

/**
 * Thin Gmail API wrapper (COMM-1, COMM-4). Only packages/core/notifications
 * should call this directly — modules go through `notify()` instead.
 */
export async function sendGmail(input: SendGmailInput): Promise<void> {
  if (!input.refreshToken) {
    throw new Error(
      "sendGmail: no refresh token provided — wire up the company mailbox GoogleToken lookup before calling this outside a test.",
    );
  }

  const auth = createGoogleClient(input.refreshToken);
  const gmail = google.gmail({ version: "v1", auth });

  await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw: buildMimeMessage(input) },
  });
}
