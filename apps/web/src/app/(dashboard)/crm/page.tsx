import { auth } from "@/auth";
import { assertCan } from "@codea-srm/core";

// Epic CRM — Admin + Sales only (PRD §6); Analyst/User have no access.
export default async function CrmPage() {
  const session = await auth();
  assertCan(session!.user.role, "crm:read");

  return (
    <section>
      <h1>Business Network (CRM)</h1>
      <p>Contact database (CRM-1..3) — not yet implemented.</p>
    </section>
  );
}
