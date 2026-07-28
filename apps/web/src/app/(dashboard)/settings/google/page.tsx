import Link from "next/link";
import { auth } from "@/auth";
import { getGoogleRefreshToken, GOOGLE_SCOPES } from "@codea-srm/core";
import { disconnectGoogleCalendar } from "./actions";

const STATUS_MESSAGES: Record<string, string> = {
  connected: "Google Calendar connected.",
  error: "Couldn't connect Google Calendar — please try again.",
};

export default async function GoogleSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const session = await auth();
  const userId = session!.user.id;

  const refreshToken = await getGoogleRefreshToken(userId, GOOGLE_SCOPES.CALENDAR_EVENTS);
  const isConnected = Boolean(refreshToken);

  return (
    <section>
      <h1>Google Calendar</h1>
      {status && STATUS_MESSAGES[status] && <p role="alert">{STATUS_MESSAGES[status]}</p>}
      <p>
        Connecting your Google Calendar lets task deadlines assigned to you appear automatically and stay in sync.
      </p>
      {isConnected ? (
        <>
          <p>Status: connected.</p>
          <form action={disconnectGoogleCalendar}>
            <button type="submit">Disconnect</button>
          </form>
        </>
      ) : (
        <>
          <p>Status: not connected.</p>
          <Link href="/api/google/connect">Connect Google Calendar</Link>
        </>
      )}
      <p>
        <Link href="/tasks">Back to tasks</Link>
      </p>
    </section>
  );
}
