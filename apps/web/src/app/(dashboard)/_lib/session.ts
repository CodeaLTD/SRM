import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { Role } from "@codea-srm/db";

/**
 * Shared by every (dashboard) route's server actions. Originally duplicated
 * per route folder (finance, then hr, then leave) since no cross-route
 * helper existed yet; extracted here once a third identical copy made the
 * duplication the thing worth fixing.
 */
export async function requireSession(): Promise<{ userId: string; role: Role; email: string }> {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return { userId: session.user.id, role: session.user.role, email: session.user.email ?? "" };
}
