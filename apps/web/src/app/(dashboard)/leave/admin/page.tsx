import Link from "next/link";
import { auth } from "@/auth";
import { assertCan } from "@codea-srm/core";
import { prisma } from "@codea-srm/db";

export default async function LeaveAdminQueuePage() {
  const session = await auth();
  assertCan(session!.user.role, "leave:approve");

  const requests = await prisma.leaveRequest.findMany({
    where: { status: "PENDING" },
    include: { requestedBy: true, substitute: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <section>
      <h1>Pending leave approvals</h1>
      <table>
        <thead>
          <tr>
            <th>Requester</th>
            <th>Type</th>
            <th>Period</th>
            <th>Substitute</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => (
            <tr key={request.id}>
              <td>{request.requestedBy.name ?? request.requestedBy.email}</td>
              <td>{request.type}</td>
              <td>
                {request.startDate.toDateString()} – {request.endDate.toDateString()}
              </td>
              <td>{request.substitute?.name ?? request.substitute?.email ?? "—"}</td>
              <td>
                <Link href={`/leave/admin/${request.id}`}>Review</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
