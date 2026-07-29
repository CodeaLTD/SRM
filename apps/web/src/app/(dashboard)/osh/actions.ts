"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { assertCan, calculateNextPeriodicDueAt, recordAuditEntry } from "@codea-srm/core";
import { prisma, type InstructionType, type Role } from "@codea-srm/db";

async function requireSession(): Promise<{ userId: string; role: Role; email: string }> {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return { userId: session.user.id, role: session.user.role, email: session.user.email ?? "" };
}

const INSTRUCTION_TYPES: InstructionType[] = ["INITIAL", "WORKPLACE", "PERIODIC", "EXTRAORDINARY"];

function readInstructionFields(formData: FormData): {
  type: InstructionType;
  employeeId: string;
  instructorId: string;
  conductedAt: Date;
} {
  const type = formData.get("type") as InstructionType;
  if (!INSTRUCTION_TYPES.includes(type)) {
    throw new Error("Invalid instruction type");
  }

  const employeeId = formData.get("employeeId") as string;
  const instructorId = formData.get("instructorId") as string;
  if (!employeeId || !instructorId) {
    throw new Error("Employee and instructor are required");
  }

  const conductedAtRaw = formData.get("conductedAt") as string;
  const conductedAt = new Date(conductedAtRaw);
  if (!conductedAtRaw || Number.isNaN(conductedAt.getTime())) {
    throw new Error("A valid conducted-on date is required");
  }

  return { type, employeeId, instructorId, conductedAt };
}

export async function createInstruction(formData: FormData): Promise<void> {
  const { userId, role } = await requireSession();
  assertCan(role, "osh:register:manage");

  const { type, employeeId, instructorId, conductedAt } = readInstructionFields(formData);
  const nextPeriodicDueAt = calculateNextPeriodicDueAt(type, conductedAt);

  const instruction = await prisma.instruction.create({
    data: {
      type,
      employeeId,
      instructorId,
      conductedAt,
      nextPeriodicDueAt,
      createdById: userId,
    },
  });

  await recordAuditEntry({
    actorId: userId,
    actorRole: role,
    action: "osh.instruction.create",
    resource: "Instruction",
    resourceId: instruction.id,
  });

  revalidatePath("/osh");
  redirect(`/osh/${instruction.id}`);
}

export async function updateInstruction(id: string, formData: FormData): Promise<void> {
  const { userId, role } = await requireSession();
  assertCan(role, "osh:register:manage");

  const instruction = await prisma.instruction.findUniqueOrThrow({ where: { id } });
  if (instruction.confirmedAt) {
    throw new Error("A confirmed instruction cannot be edited");
  }

  const { type, employeeId, instructorId, conductedAt } = readInstructionFields(formData);
  const nextPeriodicDueAt = calculateNextPeriodicDueAt(type, conductedAt);

  await prisma.instruction.update({
    where: { id },
    data: {
      type,
      employeeId,
      instructorId,
      conductedAt,
      nextPeriodicDueAt,
      // Editing the schedule invalidates any prior alert cycle.
      lastAlertedForDueAt: null,
    },
  });

  await recordAuditEntry({
    actorId: userId,
    actorRole: role,
    action: "osh.instruction.update",
    resource: "Instruction",
    resourceId: id,
  });

  revalidatePath("/osh");
  redirect(`/osh/${id}`);
}
