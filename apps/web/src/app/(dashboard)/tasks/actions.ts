"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  assertCan,
  can,
  ForbiddenError,
  isValidTaskStatusTransition,
  notifySafely,
  overlapsExistingLeave,
  recordAuditEntry,
  type TaskStatusValue,
} from "@codea-srm/core";
import { LeaveStatus, prisma, TaskStatus, type Role, type Task } from "@codea-srm/db";
import { requireSession } from "../_lib/session";
import { taskVisibilityWhere } from "./_lib/visibility";

/** Throws unless the caller created the task or is currently assigned to it — the everyday "move my card" gate. */
async function assertCanTouchTask(taskId: string, callerId: string): Promise<Task> {
  const task = await prisma.task.findFirst({
    where: { id: taskId, ...taskVisibilityWhere(callerId) },
  });
  if (!task) {
    throw new ForbiddenError("tasks:write");
  }
  return task;
}

/**
 * Throws unless the caller created the task — gates editing details, the
 * assignee set, and deletion. Ownership is baked directly into the query's
 * where clause (not fetched-then-compared in JS) so the read itself can
 * never return a row the caller doesn't own, matching the scoped-query
 * pattern used elsewhere (scopeToOwnerUnless).
 */
async function assertIsTaskCreator(taskId: string, callerId: string): Promise<Task> {
  const task = await prisma.task.findFirst({ where: { id: taskId, createdById: callerId } });
  if (!task) {
    throw new ForbiddenError("tasks:write");
  }
  return task;
}

/** Throws when a creator-scoped updateMany/deleteMany affected zero rows — the id didn't belong to this caller, or never existed. */
function assertMutatedOne(count: number): void {
  if (count === 0) {
    throw new ForbiddenError("tasks:write");
  }
}

/**
 * Warns (never blocks) when a deadline falls inside an assignee's
 * pending/approved leave — reuses the same overlap check createLeaveRequest
 * already relies on. Batched across all assignees (one leave-request query,
 * one user-name query) rather than one round trip per assignee.
 *
 * The resulting message names the assignee and their leave status, so it is
 * only returned to viewers who are either checking their own assignment or
 * already hold leave:report:read (i.e. are already authorized to see leave
 * data). Without this gate, any tasks:write holder could assign a colleague
 * to a throwaway task with a guessed deadline and use the warning banner as
 * a yes/no oracle to probe that colleague's leave dates.
 */
async function checkLeaveOverlapWarnings(
  assigneeIds: string[],
  deadline: Date,
  viewer: { id: string; role: Role },
): Promise<(string | null)[]> {
  if (assigneeIds.length === 0) return [];

  const leaveRequests = await prisma.leaveRequest.findMany({
    where: { requestedById: { in: assigneeIds }, status: { in: [LeaveStatus.PENDING, LeaveStatus.APPROVED] } },
  });
  const canSeeLeaveData = can(viewer.role, "leave:report:read");
  const overlappingIds = assigneeIds.filter((assigneeId) => {
    const isViewerVisible = assigneeId === viewer.id || canSeeLeaveData;
    if (!isViewerVisible) return false;
    const existing = leaveRequests.filter((request) => request.requestedById === assigneeId);
    return overlapsExistingLeave({ startDate: deadline, endDate: deadline }, existing);
  });
  if (overlappingIds.length === 0) return [];

  const users = await prisma.user.findMany({ where: { id: { in: overlappingIds } } });
  const userById = new Map(users.map((user) => [user.id, user]));
  return overlappingIds.map((assigneeId) => {
    const user = userById.get(assigneeId);
    return `${user?.name ?? user?.email ?? assigneeId} has a pending or approved leave request covering this deadline`;
  });
}

function redirectWithWarnings(path: string, warnings: (string | null)[]): never {
  const messages = warnings.filter((message): message is string => message !== null);
  if (messages.length > 0) {
    redirect(`${path}?warning=${encodeURIComponent(messages.join("; "))}`);
  }
  redirect(path);
}

/** Notifies each assignee in one batched lookup instead of one findUnique per assignee. */
async function notifyAssignees(assigneeIds: string[], taskTitle: string): Promise<void> {
  if (assigneeIds.length === 0) return;
  const assignees = await prisma.user.findMany({ where: { id: { in: assigneeIds } } });
  await Promise.all(
    assignees.map((assignee) =>
      notifySafely({
        userId: assignee.id,
        toEmail: assignee.email,
        subject: "You've been assigned a new task",
        bodyHtml: `<p>You've been assigned to "${taskTitle}".</p>`,
      }),
    ),
  );
}

// ---- Tasks (TASK-1/2) -----------------------------------------------------

export async function createTask(formData: FormData): Promise<void> {
  const { userId, role } = await requireSession();
  assertCan(role, "tasks:write");

  const title = (formData.get("title") as string)?.trim();
  if (!title) {
    throw new Error("Title is required");
  }
  const description = (formData.get("description") as string) || null;
  const deadlineRaw = formData.get("deadline") as string;
  const deadline = deadlineRaw ? new Date(deadlineRaw) : null;
  const assigneeIds = formData.getAll("assigneeIds") as string[];

  const task = await prisma.task.create({
    data: {
      title,
      description,
      deadline,
      createdById: userId,
      assignees: { create: assigneeIds.map((assigneeId) => ({ userId: assigneeId })) },
    },
  });

  await recordAuditEntry({ actorId: userId, actorRole: role, action: "task.create", resource: "Task", resourceId: task.id });

  const warnings = deadline ? await checkLeaveOverlapWarnings(assigneeIds, deadline, { id: userId, role }) : [];

  await notifyAssignees(assigneeIds, title);

  revalidatePath("/tasks");
  revalidatePath("/tasks/list");
  revalidatePath(`/tasks/${task.id}`);
  redirectWithWarnings(`/tasks/${task.id}`, warnings);
}

export async function updateTaskStatus(taskId: string, formData: FormData): Promise<void> {
  const { userId, role } = await requireSession();
  assertCan(role, "tasks:write");
  const task = await assertCanTouchTask(taskId, userId);

  const status = formData.get("status") as TaskStatusValue;
  if (!isValidTaskStatusTransition(status)) {
    throw new Error("Invalid status");
  }

  await prisma.task.update({ where: { id: taskId }, data: { status: status as TaskStatus } });

  await recordAuditEntry({
    actorId: userId,
    actorRole: role,
    action: "task.status_change",
    resource: "Task",
    resourceId: taskId,
    metadata: { from: task.status, to: status },
  });

  revalidatePath("/tasks");
  revalidatePath("/tasks/list");
  redirect("/tasks");
}

export async function updateTaskDetails(taskId: string, formData: FormData): Promise<void> {
  const { userId, role } = await requireSession();
  const task = await assertIsTaskCreator(taskId, userId);

  const title = (formData.get("title") as string)?.trim();
  if (!title) {
    throw new Error("Title is required");
  }
  const description = (formData.get("description") as string) || null;
  const deadlineRaw = formData.get("deadline") as string;
  const deadline = deadlineRaw ? new Date(deadlineRaw) : null;

  const result = await prisma.task.updateMany({
    where: { id: taskId, createdById: userId },
    data: { title, description, deadline },
  });
  assertMutatedOne(result.count);

  await recordAuditEntry({ actorId: userId, actorRole: role, action: "task.update", resource: "Task", resourceId: taskId });

  let warnings: (string | null)[] = [];
  const deadlineChanged = (task.deadline?.getTime() ?? null) !== (deadline?.getTime() ?? null);
  if (deadlineChanged && deadline) {
    const assignees = await prisma.taskAssignee.findMany({ where: { taskId } });
    warnings = await checkLeaveOverlapWarnings(
      assignees.map((assignee) => assignee.userId),
      deadline,
      { id: userId, role },
    );
  }

  revalidatePath("/tasks");
  revalidatePath("/tasks/list");
  revalidatePath(`/tasks/${taskId}`);
  redirectWithWarnings(`/tasks/${taskId}`, warnings);
}

export async function setTaskAssignees(taskId: string, formData: FormData): Promise<void> {
  const { userId, role } = await requireSession();
  const task = await assertIsTaskCreator(taskId, userId);

  const desiredIds = new Set(formData.getAll("assigneeIds") as string[]);
  const current = await prisma.taskAssignee.findMany({ where: { taskId } });
  const currentIds = new Set(current.map((assignee) => assignee.userId));

  const toAdd = [...desiredIds].filter((id) => !currentIds.has(id));
  const toRemove = [...currentIds].filter((id) => !desiredIds.has(id));

  await prisma.$transaction([
    prisma.taskAssignee.deleteMany({ where: { taskId, task: { createdById: userId }, userId: { in: toRemove } } }),
    prisma.taskAssignee.createMany({ data: toAdd.map((assigneeId) => ({ taskId, userId: assigneeId })) }),
  ]);

  await recordAuditEntry({
    actorId: userId,
    actorRole: role,
    action: "task.assignees.set",
    resource: "Task",
    resourceId: taskId,
    metadata: { added: toAdd, removed: toRemove },
  });

  const warnings = task.deadline
    ? await checkLeaveOverlapWarnings(toAdd, task.deadline, { id: userId, role })
    : [];

  await notifyAssignees(toAdd, task.title);

  revalidatePath("/tasks");
  revalidatePath("/tasks/list");
  revalidatePath(`/tasks/${taskId}`);
  redirectWithWarnings(`/tasks/${taskId}`, warnings);
}

export async function deleteTask(taskId: string): Promise<void> {
  const { userId, role } = await requireSession();

  const result = await prisma.task.deleteMany({ where: { id: taskId, createdById: userId } });
  assertMutatedOne(result.count);

  await recordAuditEntry({ actorId: userId, actorRole: role, action: "task.delete", resource: "Task", resourceId: taskId });

  revalidatePath("/tasks");
  revalidatePath("/tasks/list");
  redirect("/tasks");
}
