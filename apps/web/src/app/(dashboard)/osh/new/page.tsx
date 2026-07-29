import { auth } from "@/auth";
import { assertCan } from "@codea-srm/core";
import { prisma } from "@codea-srm/db";
import { createInstruction } from "../actions";

export default async function NewInstructionPage() {
  const session = await auth();
  assertCan(session!.user.role, "osh:register:manage");

  const users = await prisma.user.findMany({ orderBy: { name: "asc" } });

  return (
    <section>
      <h1>New instruction</h1>
      <form action={createInstruction}>
        <div>
          <label>
            Type
            <select name="type" required>
              <option value="INITIAL">Начален (Initial)</option>
              <option value="WORKPLACE">На работното място (Workplace)</option>
              <option value="PERIODIC">Периодичен (Periodic)</option>
              <option value="EXTRAORDINARY">Извънреден (Extraordinary)</option>
            </select>
          </label>
        </div>
        <div>
          <label>
            Employee
            <select name="employeeId" required>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name ?? u.email}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div>
          <label>
            Instructor
            <select name="instructorId" required>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name ?? u.email}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div>
          <label>
            Conducted on
            <input name="conductedAt" type="date" required />
          </label>
        </div>
        <button type="submit">Save</button>
      </form>
    </section>
  );
}
