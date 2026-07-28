import Link from "next/link";
import { auth } from "@/auth";
import { assertCan } from "@codea-srm/core";
import { prisma } from "@codea-srm/db";
import { taskVisibilityWhere } from "../_lib/visibility";

export default async function TaskListPage() {
  const session = await auth();
  const role = session!.user.role;
  const userId = session!.user.id;
  assertCan(role, "tasks:read");

  const tasks = await prisma.task.findMany({
    where: taskVisibilityWhere(userId),
    include: { createdBy: true, assignees: { include: { user: true } } },
    orderBy: [{ status: "asc" }, { deadline: "asc" }],
  });

  return (
    <section>
      <h1>Tasks — list view</h1>
      <p>
        <Link href="/tasks">Board view</Link>
        {" · "}
        <Link href="/tasks/new">New task</Link>
      </p>
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Status</th>
            <th>Assignees</th>
            <th>Deadline</th>
            <th>Creator</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id}>
              <td>
                <Link href={`/tasks/${task.id}`}>{task.title}</Link>
              </td>
              <td>{task.status}</td>
              <td>{task.assignees.map((assignee) => assignee.user.name ?? assignee.user.email).join(", ") || "—"}</td>
              <td>{task.deadline ? task.deadline.toDateString() : "—"}</td>
              <td>{task.createdBy.name ?? task.createdBy.email}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
