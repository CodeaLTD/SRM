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

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  const email = (formData.get("email") as string)?.trim() || null;
  if (email && !EMAIL_PATTERN.test(email)) {
    throw new Error("Email address is not valid");
  }
  return {
    fullName,
    position: (formData.get("position") as string)?.trim() || null,
    company: (formData.get("company") as string)?.trim() || null,
    phone: (formData.get("phone") as string)?.trim() || null,
    email,
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

  // Matches finance/actions.ts's convention: a plain update() by unique id,
  // letting Prisma's own not-found error propagate rather than a bespoke
  // updateMany+count-check.
  await prisma.contact.update({ where: { id }, data: fields });

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

  await prisma.contact.delete({ where: { id } });

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
