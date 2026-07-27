import Link from "next/link";
import { auth } from "@/auth";
import { assertCan, can } from "@codea-srm/core";
import { prisma } from "@codea-srm/db";
import { cancelLeaveRequest } from "./actions";

export default async function LeavePage() {
  const session = await auth();
  const role = session!.user.role;
  const userId = session!.user.id;
  assertCan(role, "leave:request:own");

  const requests = await prisma.leaveRequest.findMany({
    where: { requestedById: userId },
    include: { substitute: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <section>
      <h1>My leave</h1>
      {can(role, "leave:approve") && (
        <p>
          <Link href="/leave/admin">Pending approvals</Link>
        </p>
      )}
      <p>
        <Link href="/leave/new">Request leave</Link>
      </p>
      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>Period</th>
            <th>Status</th>
            <th>Substitute</th>
            <th>Decision note</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => (
            <tr key={request.id}>
              <td>{request.type}</td>
              <td>
                {request.startDate.toDateString()} – {request.endDate.toDateString()}
              </td>
              <td>{request.status}</td>
              <td>{request.substitute?.name ?? request.substitute?.email ?? "—"}</td>
              <td>{request.decisionNote ?? "—"}</td>
              <td>
                {request.status === "PENDING" && (
                  <form action={cancelLeaveRequest.bind(null, request.id)}>
                    <button type="submit">Cancel</button>
                  </form>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
