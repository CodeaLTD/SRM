import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createGoogleAuthClient, GOOGLE_SCOPES } from "@codea-srm/core";

const STATE_COOKIE = "google_oauth_state";

/**
 * Starts the Google Calendar connection flow (TASK-3). Any authenticated
 * user may connect their own calendar — this isn't capability-gated, it's
 * a personal account setting, same posture as /tasks (see middleware.ts).
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const state = randomUUID();
  const client = createGoogleAuthClient();
  const authUrl = client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [GOOGLE_SCOPES.CALENDAR_EVENTS],
    state,
  });

  const response = NextResponse.redirect(authUrl);
  // Short-lived, httpOnly — read back by /api/google/callback to prove the
  // callback request actually originated from this connect flow (CSRF).
  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return response;
}
