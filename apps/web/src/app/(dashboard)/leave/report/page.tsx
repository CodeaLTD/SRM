import { auth } from "@/auth";
import { assertCan } from "@codea-srm/core";
import { LeaveType, prisma } from "@codea-srm/db";

// HR-5 remainder: read-only leave/sick report for ТРЗ (payroll) reconciliation.
// Admin + Analyst only — Analyst never gets leave:approve or any write
// capability here, just visibility (PRD §8 Module 4 header note).
export default async function LeaveReportPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type } = await searchParams;
  const session = await auth();
  assertCan(session!.user.role, "leave:report:read");

  const typeFilter = type && Object.values(LeaveType).includes(type as LeaveType) ? (type as LeaveType) : undefined;

  // Unlike leave/page.tsx (scoped to the caller's own requests) and
  // leave/admin/page.tsx (scoped to status: PENDING), this report is
  // unscoped by design — cap it the same way finance/page.tsx caps its
  // own org-wide, unscoped listing, so leave history accumulating over
  // years doesn't turn this into an unbounded full-table render.
  const requests = await prisma.leaveRequest.findMany({
    where: typeFilter ? { type: typeFilter } : undefined,
    include: { requestedBy: true, substitute: true },
    orderBy: { startDate: "desc" },
    take: 50,
  });

  return (
    <section>
      <h1>Leave report</h1>
      <form method="get">
        <label>
          Type
          <select name="type" defaultValue={typeFilter ?? ""}>
            <option value="">All</option>
            {Object.values(LeaveType).map((leaveType) => (
              <option key={leaveType} value={leaveType}>
                {leaveType}
              </option>
            ))}
          </select>
        </label>
        <button type="submit">Filter</button>
      </form>
      <table>
        <thead>
          <tr>
            <th>Employee</th>
            <th>Type</th>
            <th>Period</th>
            <th>Status</th>
            <th>Substitute</th>
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
              <td>{request.status}</td>
              <td>{request.substitute?.name ?? request.substitute?.email ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
