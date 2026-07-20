import { google } from "googleapis";

/**
 * One OAuth2 client factory reused by both the Gmail and Calendar
 * wrappers, so token refresh logic lives in exactly one place. Callers
 * pass in the user's stored (decrypted) refresh token — encryption/
 * decryption of GoogleToken.encryptedBlob happens at the call site in
 * apps/web's Google connection flow, not here.
 */
export function createGoogleClient(refreshToken: string): InstanceType<typeof google.auth.OAuth2> {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_OAUTH_CLIENT_ID,
    process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    process.env.GOOGLE_OAUTH_REDIRECT_URI,
  );
  client.setCredentials({ refresh_token: refreshToken });
  return client;
}

export const GOOGLE_SCOPES = {
  GMAIL_SEND: "https://www.googleapis.com/auth/gmail.send",
  CALENDAR_EVENTS: "https://www.googleapis.com/auth/calendar.events",
} as const;
