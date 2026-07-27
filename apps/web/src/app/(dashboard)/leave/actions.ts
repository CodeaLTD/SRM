"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  assertCan,
  escapeHtml,
  ForbiddenError,
  isValidLeavePeriod,
  notifySafely,
  overlapsExistingLeave,
  recordAuditEntry,
  scopeToOwnerUnless,
} from "@codea-srm/core";
import { LeaveStatus, LeaveType, prisma, Role } from "@codea-srm/db";
import { requireSession } from "../_lib/session";

// ---- Leave requests (HR-4/5) ---------------------------------------------

export async function createLeaveRequest(formData: FormData): Promise<void> {
  const { userId, role } = await requireSession();
  assertCan(role, "leave:request:own");

  const startDate = new Date(formData.get("startDate") as string);
  const endDate = new Date(formData.get("endDate") as string);
  if (!isValidLeavePeriod(startDate, endDate)) {
    throw new Error("End date must not be before start date");
  }

  const existing = await prisma.leaveRequest.findMany({
    where: { requestedById: userId, status: { in: [LeaveStatus.PENDING, LeaveStatus.APPROVED] } },
  });
  if (overlapsExistingLeave({ startDate, endDate }, existing)) {
    throw new Error("This period overlaps an existing pending or approved leave request");
  }

  const substituteId = (formData.get("substituteId") as string) || null;
  if (substituteId) {
    if (substituteId === userId) {
      throw new Error("You cannot name yourself as your own substitute");
    }
    const substitute = await prisma.user.findUnique({ where: { id: substituteId } });
    if (!substitute) {
      throw new Error("Selected substitute no longer exists");
    }
  }

  const leaveRequest = await prisma.leaveRequest.create({
    data: {
      type: formData.get("type") as LeaveType,
      status: LeaveStatus.PENDING,
      startDate,
      endDate,
      reason: (formData.get("reason") as string) || null,
      substituteId,
      requestedById: userId,
    },
  });

  await recordAuditEntry({
    actorId: userId,
    actorRole: role,
    action: "leave.request",
    resource: "LeaveRequest",
    resourceId: leaveRequest.id,
  });

  const admins = await prisma.user.findMany({ where: { role: Role.ADMIN } });
  await Promise.all(
    admins.map((admin) =>
      notifySafely({
        userId: admin.id,
        toEmail: admin.email,
        subject: "New leave request awaiting approval",
        bodyHtml: `<p>A new ${leaveRequest.type} leave request from ${startDate.toDateString()} to ${endDate.toDateString()} is awaiting your approval.</p>`,
      }),
    ),
  );

  revalidatePath("/leave");
  redirect("/leave");
}

export async function cancelLeaveRequest(id: string): Promise<void> {
  const { userId, role } = await requireSession();
  assertCan(role, "leave:request:own");

  const leaveRequest = await prisma.leaveRequest.findUniqueOrThrow({ where: { id } });
  // Same own-or-elevated-capability scoping as assertCanWriteProfile in
  // hr/actions.ts — both go through scopeToOwnerUnless so this stays one
  // shared mechanism instead of two independently-hand-rolled checks.
  const scope = scopeToOwnerUnless(role, "leave:approve", userId);
  if (scope.ownerId && scope.ownerId !== leaveRequest.requestedById) {
    throw new ForbiddenError("leave:approve");
  }
  if (leaveRequest.status !== LeaveStatus.PENDING) {
    throw new Error("Only a pending request can be cancelled");
  }

  await prisma.leaveRequest.update({ where: { id }, data: { status: LeaveStatus.CANCELLED } });

  await recordAuditEntry({
    actorId: userId,
    actorRole: role,
    action: "leave.cancel",
    resource: "LeaveRequest",
    resourceId: id,
  });

  revalidatePath("/leave");
  redirect("/leave");
}

export async function approveLeaveRequest(id: string, formData: FormData): Promise<void> {
  const { userId, role } = await requireSession();
  assertCan(role, "leave:approve");

  const leaveRequest = await prisma.leaveRequest.findUniqueOrThrow({ where: { id }, include: { requestedBy: true } });
  if (leaveRequest.status !== LeaveStatus.PENDING) {
    throw new Error("Leave request is not awaiting approval");
  }

  const decisionNote = (formData.get("note") as string) || null;

  await prisma.leaveRequest.update({
    where: { id },
    data: { status: LeaveStatus.APPROVED, approvedById: userId, decidedAt: new Date(), decisionNote },
  });

  await recordAuditEntry({
    actorId: userId,
    actorRole: role,
    action: "leave.approve",
    resource: "LeaveRequest",
    resourceId: id,
  });

  await notifySafely({
    userId: leaveRequest.requestedById,
    toEmail: leaveRequest.requestedBy.email,
    subject: "Your leave request was approved",
    bodyHtml: `<p>Your ${leaveRequest.type} leave from ${leaveRequest.startDate.toDateString()} to ${leaveRequest.endDate.toDateString()} was approved.</p>`,
  });

  // TODO(HR-6): once Google Calendar OAuth consent is wired up, call
  // upsertCalendarEvent({ refreshToken, summary: "Out of Office", ... })
  // here for the requester's calendar, and persist the resulting eventId
  // (a future `calendarEventId` column on LeaveRequest) so a later
  // cancellation/rejection can delete it via deleteCalendarEvent. Deferred
  // until Google OAuth is available — see packages/core/src/google/calendar.ts,
  // which already documents this call site.

  revalidatePath("/leave");
  revalidatePath("/leave/admin");
  redirect("/leave/admin");
}

export async function rejectLeaveRequest(id: string, formData: FormData): Promise<void> {
  const { userId, role } = await requireSession();
  assertCan(role, "leave:approve");

  const leaveRequest = await prisma.leaveRequest.findUniqueOrThrow({ where: { id }, include: { requestedBy: true } });
  if (leaveRequest.status !== LeaveStatus.PENDING) {
    throw new Error("Leave request is not awaiting approval");
  }

  const decisionNote = (formData.get("note") as string) || null;
  if (!decisionNote) {
    throw new Error("A reason is required to reject a leave request");
  }

  await prisma.leaveRequest.update({
    where: { id },
    data: { status: LeaveStatus.REJECTED, approvedById: userId, decidedAt: new Date(), decisionNote },
  });

  await recordAuditEntry({
    actorId: userId,
    actorRole: role,
    action: "leave.reject",
    resource: "LeaveRequest",
    resourceId: id,
  });

  await notifySafely({
    userId: leaveRequest.requestedById,
    toEmail: leaveRequest.requestedBy.email,
    subject: "Your leave request was rejected",
    bodyHtml: `<p>Your ${leaveRequest.type} leave from ${leaveRequest.startDate.toDateString()} to ${leaveRequest.endDate.toDateString()} was rejected: ${escapeHtml(decisionNote)}</p>`,
  });

  revalidatePath("/leave");
  revalidatePath("/leave/admin");
  redirect("/leave/admin");
}
