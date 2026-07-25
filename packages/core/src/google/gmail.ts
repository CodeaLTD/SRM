import { google } from "googleapis";
import MailComposer from "nodemailer/lib/mail-composer/index.js";
import { createGoogleClient } from "./client";

export interface SendGmailInput {
  to: string;
  subject: string;
  html: string;
  attachments?: { filename: string; content: Buffer; contentType: string }[];
  /** Service-account/company sender's stored refresh token. Defaults to a shared company mailbox token if omitted — TODO once GoogleToken lookup is wired in. */
  refreshToken?: string;
}

/**
 * Built on nodemailer's MailComposer rather than hand-rolled string
 * concatenation: `to`/`subject`/attachment filenames can contain
 * user-influenced data (a task title, a CRM contact's name, an uploaded
 * filename), and MailComposer — unlike naive template interpolation —
 * strips CR/LF from header values (preventing header injection) and
 * RFC 2047-encodes non-ASCII subjects (needed for Cyrillic, given this is
 * a Bulgarian company) instead of sending them as raw mojibake.
 */
export async function buildMimeMessage(input: SendGmailInput): Promise<string> {
  const mail = new MailComposer({
    to: input.to,
    subject: input.subject,
    html: input.html,
    attachments: input.attachments?.map((a) => ({
      filename: a.filename,
      content: a.content,
      contentType: a.contentType,
    })),
  });

  const message = await new Promise<Buffer>((resolve, reject) => {
    mail.compile().build((err, msg) => (err ? reject(err) : resolve(msg)));
  });

  return message.toString("base64url");
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
    requestBody: { raw: await buildMimeMessage(input) },
  });
}
