import Link from "next/link";
import { auth } from "@/auth";
import { assertCan, TASK_STATUSES, TASK_STATUS_LABELS } from "@codea-srm/core";
import { prisma } from "@codea-srm/db";
import { updateTaskStatus } from "./actions";
import { taskVisibilityWhere } from "./_lib/visibility";

// Epic TASK — Kanban board (TASK-1/2). No drag-and-drop: this app has no
// client components anywhere yet, so status changes are plain per-card
// "Move to X" button-forms rather than introducing the app's first
// client-side interactivity just for this page.
export default async function TasksPage({ searchParams }: { searchParams: Promise<{ warning?: string }> }) {
  const { warning } = await searchParams;
  const session = await auth();
  const role = session!.user.role;
  const userId = session!.user.id;
  assertCan(role, "tasks:read");

  const tasks = await prisma.task.findMany({
    where: taskVisibilityWhere(userId),
    include: { createdBy: true, assignees: { include: { user: true } } },
    orderBy: { createdAt: "desc" },
  });

  const columns = TASK_STATUSES.map((status) => ({ status, title: TASK_STATUS_LABELS[status] }));

  function moveButtons(taskId: string, status: string) {
    const boundUpdate = updateTaskStatus.bind(null, taskId);
    if (status === "TODO") {
      return (
        <form action={boundUpdate}>
          <input type="hidden" name="status" value="IN_PROGRESS" />
          <button type="submit">Start</button>
        </form>
      );
    }
    if (status === "IN_PROGRESS") {
      return (
        <>
          <form action={boundUpdate} style={{ display: "inline" }}>
            <input type="hidden" name="status" value="DONE" />
            <button type="submit">Complete</button>
          </form>
          <form action={boundUpdate} style={{ display: "inline" }}>
            <input type="hidden" name="status" value="TODO" />
            <button type="submit">Back to To Do</button>
          </form>
        </>
      );
    }
    return (
      <form action={boundUpdate}>
        <input type="hidden" name="status" value="TODO" />
        <button type="submit">Reopen</button>
      </form>
    );
  }

  return (
    <section>
      <h1>Tasks</h1>
      {warning && <p role="alert">{warning}</p>}
      <p>
        <Link href="/tasks/new">New task</Link>
        {" · "}
        <Link href="/tasks/list">List view</Link>
        {" · "}
        <Link href="/settings/google">Google Calendar settings</Link>
      </p>
      <div style={{ display: "flex", gap: "1rem" }}>
        {columns.map((column) => (
          <div key={column.status} style={{ flex: 1 }}>
            <h2>{column.title}</h2>
            {tasks
              .filter((task) => task.status === column.status)
              .map((task) => (
                <div key={task.id} style={{ border: "1px solid #ccc", padding: "0.5rem", marginBottom: "0.5rem" }}>
                  <Link href={`/tasks/${task.id}`}>{task.title}</Link>
                  <p>
                    {task.assignees.map((assignee) => assignee.user.name ?? assignee.user.email).join(", ") || "Unassigned"}
                  </p>
                  <p>{task.deadline ? task.deadline.toDateString() : "No deadline"}</p>
                  {moveButtons(task.id, task.status)}
                </div>
              ))}
          </div>
        ))}
      </div>
    </section>
  );
}
