import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { assertCan } from "@codea-srm/core";
import { prisma } from "@codea-srm/db";
import { updateTaskStatus } from "../actions";
import { taskVisibilityWhere } from "../_lib/visibility";

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const role = session!.user.role;
  const userId = session!.user.id;
  assertCan(role, "tasks:read");

  const task = await prisma.task.findFirst({
    where: { id, ...taskVisibilityWhere(userId) },
    include: { createdBy: true, assignees: { include: { user: true } } },
  });
  if (!task) notFound();

  const isCreator = task.createdById === userId;
  const boundUpdate = updateTaskStatus.bind(null, task.id);

  return (
    <section>
      <h1>{task.title}</h1>
      <p>
        <Link href="/tasks">Board</Link>
        {" · "}
        <Link href="/tasks/list">List</Link>
        {isCreator && (
          <>
            {" · "}
            <Link href={`/tasks/${task.id}/edit`}>Edit</Link>
          </>
        )}
      </p>
      <dl>
        <dt>Description</dt>
        <dd>{task.description ?? "—"}</dd>
        <dt>Status</dt>
        <dd>{task.status}</dd>
        <dt>Deadline</dt>
        <dd>{task.deadline ? task.deadline.toDateString() : "—"}</dd>
        <dt>Creator</dt>
        <dd>{task.createdBy.name ?? task.createdBy.email}</dd>
        <dt>Assignees</dt>
        <dd>{task.assignees.map((assignee) => assignee.user.name ?? assignee.user.email).join(", ") || "—"}</dd>
      </dl>

      <form action={boundUpdate}>
        <label>
          Move to
          <select name="status" defaultValue={task.status}>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="DONE">Done</option>
          </select>
        </label>
        <button type="submit">Update status</button>
      </form>
    </section>
  );
}
