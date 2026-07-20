import { auth } from "@/auth";
import { assertCan } from "@codea-srm/core";

// Epic HR — Admin/Sales see the full skills matrix; User sees/edits only
// their own CV (HR-1, scoped via scopeToOwnerUnless once the model exists).
export default async function HrPage() {
  const session = await auth();
  assertCan(session!.user.role, "hr:cv:read");

  return (
    <section>
      <h1>HR &amp; Skills Matrix</h1>
      <p>CV database (HR-1) — not yet implemented.</p>
    </section>
  );
}
