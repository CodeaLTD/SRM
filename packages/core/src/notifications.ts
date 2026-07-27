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

/**
 * Best-effort variant for callers where a failed send must not abort the
 * surrounding action (e.g. a DB write/audit entry has already committed by
 * the time this runs) — catches and logs instead of throwing. Returns
 * whether the send succeeded so a caller that needs to branch on it (e.g.
 * a retry-scan job skipping its "already alerted" bookkeeping on failure)
 * still can, without every caller re-implementing its own try/catch.
 */
export async function notifySafely(input: NotifyInput): Promise<boolean> {
  try {
    await notify(input);
    return true;
  } catch (error) {
    console.error(`[notify] failed to notify ${input.toEmail}`, error);
    return false;
  }
}
