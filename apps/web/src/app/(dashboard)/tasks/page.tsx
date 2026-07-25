import { auth } from "@/auth";
import { assertCan } from "@codea-srm/core";

// Epic TASK — kanban board + list views (TASK-1). Placeholder until the
// Task model + board UI land; demonstrates the data-layer RBAC check
// pattern every module page should follow.
export default async function TasksPage() {
  const session = await auth();
  assertCan(session!.user.role, "tasks:read");

  return (
    <section>
      <h1>Tasks</h1>
      <p>Kanban board (TASK-1) — not yet implemented.</p>
    </section>
  );
}
