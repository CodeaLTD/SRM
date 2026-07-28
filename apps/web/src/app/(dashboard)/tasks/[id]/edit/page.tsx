import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { assertCan } from "@codea-srm/core";
import { prisma } from "@codea-srm/db";
import { deleteTask, setTaskAssignees, updateTaskDetails } from "../../actions";
import { taskVisibilityWhere } from "../../_lib/visibility";

function toDateInputValue(date: Date | null): string {
  return date ? date.toISOString().slice(0, 10) : "";
}

export default async function EditTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const role = session!.user.role;
  const userId = session!.user.id;
  assertCan(role, "tasks:write");

  const task = await prisma.task.findFirst({
    where: { id, ...taskVisibilityWhere(userId) },
    include: { assignees: { include: { user: true } } },
  });
  if (!task) notFound();
  // Visible (creator or assignee) but not the creator — they know it
  // exists, they just can't edit it, so send them to the read-only view
  // rather than hiding it entirely.
  if (task.createdById !== userId) redirect(`/tasks/${id}`);

  const colleagues = await prisma.user.findMany({ orderBy: { name: "asc" } });
  const assignedIds = new Set(task.assignees.map((assignee) => assignee.userId));

  const boundUpdateDetails = updateTaskDetails.bind(null, task.id);
  const boundSetAssignees = setTaskAssignees.bind(null, task.id);
  const boundDelete = deleteTask.bind(null, task.id);

  return (
    <section>
      <h1>Edit task</h1>
      <form action={boundUpdateDetails}>
        <div>
          <label>
            Title
            <input name="title" defaultValue={task.title} required />
          </label>
        </div>
        <div>
          <label>
            Description
            <textarea name="description" defaultValue={task.description ?? ""} />
          </label>
        </div>
        <div>
          <label>
            Deadline
            <input name="deadline" type="date" defaultValue={toDateInputValue(task.deadline)} />
          </label>
        </div>
        <button type="submit">Save details</button>
      </form>

      <form action={boundSetAssignees}>
        <fieldset>
          <legend>Assignees</legend>
          {colleagues.map((colleague) => (
            <label key={colleague.id} style={{ display: "block" }}>
              <input type="checkbox" name="assigneeIds" value={colleague.id} defaultChecked={assignedIds.has(colleague.id)} />
              {colleague.name ?? colleague.email}
            </label>
          ))}
        </fieldset>
        <button type="submit">Save assignees</button>
      </form>

      <form action={boundDelete}>
        <button type="submit">Delete task</button>
      </form>
    </section>
  );
}
