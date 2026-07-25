import { auth } from "@/auth";
import { redirect } from "next/navigation";

/**
 * Shared shell for every RBAC-gated module route group below. Middleware
 * (src/middleware.ts) already redirects unauthenticated/unauthorized
 * requests before this renders — this second check is defense in depth,
 * not the primary gate, per NFR-AUTHZ's "not just the UI" requirement.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div>
      <nav>Codea SRM — signed in as {session.user.email} ({session.user.role})</nav>
      <main>{children}</main>
    </div>
  );
}
