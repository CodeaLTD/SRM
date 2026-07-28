import { auth } from "@/auth";
import { assertCan } from "@codea-srm/core";
import { prisma } from "@codea-srm/db";
import { createTask } from "../actions";

export default async function NewTaskPage() {
  const session = await auth();
  const role = session!.user.role;
  assertCan(role, "tasks:write");

  const colleagues = await prisma.user.findMany({ orderBy: { name: "asc" } });

  return (
    <section>
      <h1>New task</h1>
      <form action={createTask}>
        <div>
          <label>
            Title
            <input name="title" required />
          </label>
        </div>
        <div>
          <label>
            Description
            <textarea name="description" />
          </label>
        </div>
        <div>
          <label>
            Deadline
            <input name="deadline" type="date" />
          </label>
        </div>
        <fieldset>
          <legend>Assignees</legend>
          {colleagues.map((colleague) => (
            <label key={colleague.id} style={{ display: "block" }}>
              <input type="checkbox" name="assigneeIds" value={colleague.id} />
              {colleague.name ?? colleague.email}
            </label>
          ))}
        </fieldset>
        <button type="submit">Create task</button>
      </form>
    </section>
  );
}
