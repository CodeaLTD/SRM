import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { assertCan } from "@codea-srm/core";
import { prisma } from "@codea-srm/db";
import { updateInstruction } from "../../actions";

export default async function EditInstructionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  assertCan(session!.user.role, "osh:register:manage");

  const [instruction, users] = await Promise.all([
    prisma.instruction.findUnique({ where: { id } }),
    prisma.user.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!instruction) notFound();
  if (instruction.confirmedAt) {
    throw new Error("A confirmed instruction cannot be edited");
  }

  const boundUpdate = updateInstruction.bind(null, id);

  return (
    <section>
      <h1>Edit instruction</h1>
      <form action={boundUpdate}>
        <div>
          <label>
            Type
            <select name="type" defaultValue={instruction.type} required>
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
            <select name="employeeId" defaultValue={instruction.employeeId} required>
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
            <select name="instructorId" defaultValue={instruction.instructorId} required>
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
            <input
              name="conductedAt"
              type="date"
              defaultValue={instruction.conductedAt.toISOString().slice(0, 10)}
              required
            />
          </label>
        </div>
        <button type="submit">Save</button>
      </form>
    </section>
  );
}
