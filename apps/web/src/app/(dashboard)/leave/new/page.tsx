import { auth } from "@/auth";
import { assertCan } from "@codea-srm/core";
import { prisma } from "@codea-srm/db";
import { createLeaveRequest } from "../actions";

export default async function NewLeaveRequestPage() {
  const session = await auth();
  const role = session!.user.role;
  const userId = session!.user.id;
  assertCan(role, "leave:request:own");

  const colleagues = await prisma.user.findMany({ where: { id: { not: userId } }, orderBy: { name: "asc" } });

  return (
    <section>
      <h1>Request leave</h1>
      <form action={createLeaveRequest}>
        <div>
          <label>
            Type
            <select name="type" defaultValue="PAID">
              <option value="PAID">Paid</option>
              <option value="UNPAID">Unpaid</option>
              <option value="SICK">Sick</option>
            </select>
          </label>
        </div>
        <div>
          <label>
            Start date
            <input name="startDate" type="date" required />
          </label>
        </div>
        <div>
          <label>
            End date
            <input name="endDate" type="date" required />
          </label>
        </div>
        <div>
          <label>
            Substitute
            <select name="substituteId" defaultValue="">
              <option value="">None</option>
              {colleagues.map((colleague) => (
                <option key={colleague.id} value={colleague.id}>
                  {colleague.name ?? colleague.email}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div>
          <label>
            Reason
            <textarea name="reason" />
          </label>
        </div>
        <button type="submit">Submit request</button>
      </form>
    </section>
  );
}
