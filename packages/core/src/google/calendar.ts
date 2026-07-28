import { google } from "googleapis";
import { createGoogleClient } from "./client";

export interface CalendarEventInput {
  refreshToken: string;
  summary: string;
  description?: string;
  startIso: string;
  endIso: string;
  /** Set on create; pass back in to update the same event instead of duplicating it. */
  eventId?: string;
}

/**
 * One Calendar integration point for the whole product — used by TASK-3
 * (deadline sync), HR-6 (Out-of-Office on leave approval), and OSH-4
 * (repeat-instruction reminders). Callers pass the responsible user's
 * refresh token; upsert semantics (create if no eventId, else update) keep
 * "assignees changed" / "deadline changed" flows idempotent.
 */
export async function upsertCalendarEvent(input: CalendarEventInput): Promise<string> {
  const auth = createGoogleClient(input.refreshToken);
  const calendar = google.calendar({ version: "v3", auth });

  const requestBody = {
    summary: input.summary,
    description: input.description,
    start: { dateTime: input.startIso },
    end: { dateTime: input.endIso },
  };

  if (input.eventId) {
    const { data } = await calendar.events.update({
      calendarId: "primary",
      eventId: input.eventId,
      requestBody,
    });
    return data.id!;
  }

  const { data } = await calendar.events.insert({
    calendarId: "primary",
    requestBody,
  });
  return data.id!;
}

export async function deleteCalendarEvent(refreshToken: string, eventId: string): Promise<void> {
  const auth = createGoogleClient(refreshToken);
  const calendar = google.calendar({ version: "v3", auth });
  await calendar.events.delete({ calendarId: "primary", eventId });
}

/**
 * Best-effort variants (mirrors notify/notifySafely) — a Calendar API
 * hiccup (expired grant, transient API error) must never abort the
 * surrounding task/leave/OSH mutation. Returns null/false on failure
 * instead of throwing, and logs so the failure isn't silently lost.
 */
export async function upsertCalendarEventSafely(input: CalendarEventInput): Promise<string | null> {
  try {
    return await upsertCalendarEvent(input);
  } catch (error) {
    console.error(`[calendar] failed to upsert event "${input.summary}"`, error);
    return null;
  }
}

export async function deleteCalendarEventSafely(refreshToken: string, eventId: string): Promise<boolean> {
  try {
    await deleteCalendarEvent(refreshToken, eventId);
    return true;
  } catch (error) {
    console.error(`[calendar] failed to delete event ${eventId}`, error);
    return false;
  }
}
