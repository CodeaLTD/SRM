import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { assertCan } from "@codea-srm/core";
import { prisma } from "@codea-srm/db";
import { approveLeaveRequest, rejectLeaveRequest } from "../../actions";

export default async function LeaveApprovalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  assertCan(session!.user.role, "leave:approve");

  const leaveRequest = await prisma.leaveRequest.findUnique({
    where: { id },
    include: { requestedBy: true, substitute: true, approvedBy: true },
  });
  if (!leaveRequest) notFound();

  const boundApprove = approveLeaveRequest.bind(null, id);
  const boundReject = rejectLeaveRequest.bind(null, id);

  if (leaveRequest.status !== "PENDING") {
    return (
      <section>
        <h1>Leave request</h1>
        <dl>
          <dt>Requester</dt>
          <dd>{leaveRequest.requestedBy.name ?? leaveRequest.requestedBy.email}</dd>
          <dt>Status</dt>
          <dd>{leaveRequest.status}</dd>
          <dt>Decided by</dt>
          <dd>{leaveRequest.approvedBy?.name ?? leaveRequest.approvedBy?.email ?? "—"}</dd>
          <dt>Decision note</dt>
          <dd>{leaveRequest.decisionNote ?? "—"}</dd>
        </dl>
      </section>
    );
  }

  return (
    <section>
      <h1>Review leave request</h1>
      <dl>
        <dt>Requester</dt>
        <dd>{leaveRequest.requestedBy.name ?? leaveRequest.requestedBy.email}</dd>
        <dt>Type</dt>
        <dd>{leaveRequest.type}</dd>
        <dt>Period</dt>
        <dd>
          {leaveRequest.startDate.toDateString()} – {leaveRequest.endDate.toDateString()}
        </dd>
        <dt>Substitute</dt>
        <dd>{leaveRequest.substitute?.name ?? leaveRequest.substitute?.email ?? "—"}</dd>
        <dt>Reason</dt>
        <dd>{leaveRequest.reason ?? "—"}</dd>
      </dl>

      <form action={boundApprove}>
        <label>
          Note (optional)
          <input name="note" />
        </label>
        <button type="submit">Approve</button>
      </form>

      <form action={boundReject}>
        <label>
          Reason (required)
          <input name="note" required />
        </label>
        <button type="submit">Reject</button>
      </form>
    </section>
  );
}
