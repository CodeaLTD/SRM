import { auth } from "@/auth";
import { assertCanAny } from "@codea-srm/core";

// Epic HR — Admin/Sales see the full skills matrix (hr:cv:read); User sees/
// edits only their own CV (hr:cv:write:own, scoped via scopeToOwnerUnless
// once the model exists) — the route admits User, so the page must accept
// either capability, not just the "read everyone's" one.
export default async function HrPage() {
  const session = await auth();
  assertCanAny(session!.user.role, ["hr:cv:read", "hr:cv:write:own"]);

  return (
    <section>
      <h1>HR &amp; Skills Matrix</h1>
      <p>CV database (HR-1) — not yet implemented.</p>
    </section>
  );
}
