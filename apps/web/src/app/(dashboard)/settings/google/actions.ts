"use server";

import { revalidatePath } from "next/cache";
import { deleteGoogleToken, GOOGLE_SCOPES, recordAuditEntry } from "@codea-srm/core";
import { requireSession } from "../../_lib/session";

export async function disconnectGoogleCalendar(): Promise<void> {
  const { userId, role } = await requireSession();

  await deleteGoogleToken(userId, GOOGLE_SCOPES.CALENDAR_EVENTS);

  await recordAuditEntry({
    actorId: userId,
    actorRole: role,
    action: "google.calendar.disconnect",
    resource: "GoogleToken",
    resourceId: userId,
  });

  revalidatePath("/settings/google");
}
