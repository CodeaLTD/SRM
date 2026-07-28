import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createGoogleAuthClient, GOOGLE_SCOPES, recordAuditEntry, saveGoogleRefreshToken } from "@codea-srm/core";

const STATE_COOKIE = "google_oauth_state";

function redirectToSettings(request: Request, status: "connected" | "error"): NextResponse {
  const url = new URL("/settings/google", request.url);
  url.searchParams.set("status", status);
  const response = NextResponse.redirect(url);
  response.cookies.delete(STATE_COOKIE);
  return response;
}

/**
 * Exchanges the authorization code from /api/google/connect for a refresh
 * token and persists it (encrypted) via saveGoogleRefreshToken. Never
 * throws an unhandled error back at Google's redirect — any failure here
 * (denied consent, state mismatch, exchange error, no refresh_token in the
 * response) redirects to a plain error indicator on /settings/google.
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieState = request.headers
    .get("cookie")
    ?.split("; ")
    .find((entry) => entry.startsWith(`${STATE_COOKIE}=`))
    ?.split("=")[1];

  if (!code || !state || !cookieState || state !== cookieState) {
    return redirectToSettings(request, "error");
  }

  try {
    const client = createGoogleAuthClient();
    const { tokens } = await client.getToken(code);
    if (!tokens.refresh_token) {
      // Consent already granted previously without prompt=consent reaching
      // Google — no refresh_token is returned on a "silent" re-consent.
      return redirectToSettings(request, "error");
    }

    const expiresAt = tokens.expiry_date ? new Date(tokens.expiry_date) : new Date(Date.now() + 3600_000);
    await saveGoogleRefreshToken(session.user.id, GOOGLE_SCOPES.CALENDAR_EVENTS, tokens.refresh_token, expiresAt);

    await recordAuditEntry({
      actorId: session.user.id,
      actorRole: session.user.role,
      action: "google.calendar.connect",
      resource: "GoogleToken",
      resourceId: session.user.id,
    });

    return redirectToSettings(request, "connected");
  } catch (error) {
    console.error("[google callback] failed to exchange code for tokens", error);
    return redirectToSettings(request, "error");
  }
}
