import { sendGmail } from "./google/gmail";

export interface NotifyInput {
  userId: string;
  /** Recipient's email — resolved by the caller (e.g. from the User record) so this module stays DB-agnostic. */
  toEmail: string;
  subject: string;
  bodyHtml: string;
  /** Base64 or Buffer attachments, e.g. a PDF from packages/core/pdf.ts. */
  attachments?: { filename: string; content: Buffer; contentType: string }[];
}

/**
 * The single interface every module goes through to notify a user
 * (email today; in-app notification records land here too once the
 * `Notification` model exists). Modules must call this instead of
 * calling the Gmail wrapper directly, so channel choice/fan-out is a
 * one-place change (COMM-1, OSH-5, HR-5/6, FIN-7).
 */
export async function notify(input: NotifyInput): Promise<void> {
  await sendGmail({
    to: input.toEmail,
    subject: input.subject,
    html: input.bodyHtml,
    attachments: input.attachments,
  });

  // TODO(COMM): also insert an in-app Notification row once that model
  // exists in packages/db — deferred until the COMM epic starts.
}
