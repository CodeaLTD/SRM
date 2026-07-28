"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { assertCan, parseTags, recordAuditEntry } from "@codea-srm/core";
import { prisma, type Role } from "@codea-srm/db";

async function requireSession(): Promise<{ userId: string; role: Role; email: string }> {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return { userId: session.user.id, role: session.user.role, email: session.user.email ?? "" };
}

/** Throws when a deleteMany/updateMany affected zero rows — the id didn't exist. */
function assertMutatedOne(count: number, message: string): void {
  if (count === 0) {
    throw new Error(message);
  }
}

interface ContactFields {
  fullName: string;
  position: string | null;
  company: string | null;
  phone: string | null;
  email: string | null;
  linkedInUrl: string | null;
  notes: string | null;
  tags: string[];
}

function readContactFields(formData: FormData): ContactFields {
  const fullName = (formData.get("fullName") as string)?.trim();
  if (!fullName) {
    throw new Error("Full name is required");
  }
  return {
    fullName,
    position: (formData.get("position") as string)?.trim() || null,
    company: (formData.get("company") as string)?.trim() || null,
    phone: (formData.get("phone") as string)?.trim() || null,
    email: (formData.get("email") as string)?.trim() || null,
    linkedInUrl: (formData.get("linkedInUrl") as string)?.trim() || null,
    notes: (formData.get("notes") as string)?.trim() || null,
    tags: parseTags((formData.get("tags") as string) ?? ""),
  };
}

// ---- Contacts (CRM-1/2/3) --------------------------------------------------

export async function createContact(formData: FormData): Promise<void> {
  const { userId, role } = await requireSession();
  assertCan(role, "crm:write");

  const fields = readContactFields(formData);

  const contact = await prisma.contact.create({
    data: { ...fields, createdById: userId },
  });

  await recordAuditEntry({
    actorId: userId,
    actorRole: role,
    action: "crm.contact.create",
    resource: "Contact",
    resourceId: contact.id,
  });

  revalidatePath("/crm");
  redirect(`/crm/${contact.id}`);
}

export async function updateContact(id: string, formData: FormData): Promise<void> {
  const { userId, role } = await requireSession();
  assertCan(role, "crm:write");

  const fields = readContactFields(formData);

  const result = await prisma.contact.updateMany({ where: { id }, data: fields });
  assertMutatedOne(result.count, "Contact not found");

  await recordAuditEntry({
    actorId: userId,
    actorRole: role,
    action: "crm.contact.update",
    resource: "Contact",
    resourceId: id,
  });

  revalidatePath("/crm");
  revalidatePath(`/crm/${id}`);
  redirect(`/crm/${id}`);
}

export async function deleteContact(id: string): Promise<void> {
  const { userId, role } = await requireSession();
  assertCan(role, "crm:write");

  const result = await prisma.contact.deleteMany({ where: { id } });
  assertMutatedOne(result.count, "Contact not found");

  await recordAuditEntry({
    actorId: userId,
    actorRole: role,
    action: "crm.contact.delete",
    resource: "Contact",
    resourceId: id,
  });

  revalidatePath("/crm");
  redirect("/crm");
}
