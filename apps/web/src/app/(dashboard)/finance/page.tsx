import { auth } from "@/auth";
import { assertCan } from "@codea-srm/core";

// Epic FIN — Admin + Analyst only (PRD §6). Middleware already blocks
// Sales/User at the route level; this is the data-layer check (NFR-AUTHZ).
export default async function FinancePage() {
  const session = await auth();
  assertCan(session!.user.role, "finance:read");

  return (
    <section>
      <h1>Finance &amp; Documents</h1>
      <p>Transactions, OCR intake (FIN-3/4/5) — not yet implemented.</p>
    </section>
  );
}
