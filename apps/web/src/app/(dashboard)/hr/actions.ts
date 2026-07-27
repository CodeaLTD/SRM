"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertCan, assertCanAny, ForbiddenError, recordAuditEntry, scopeToOwnerUnless } from "@codea-srm/core";
import { ExpertiseLevel, LanguageProficiency, Prisma, prisma, SkillCategory, type Role } from "@codea-srm/db";
import { requireSession } from "../_lib/session";

/**
 * Throws unless the caller may write the given profile owner's CV — either
 * it's their own (hr:cv:write:own) or they hold hr:cv:write:any. Built on
 * the shared scopeToOwnerUnless (packages/core/src/rbac.ts) rather than a
 * hand-rolled comparison, so this stays in sync with the same own-vs-any
 * scoping every other module uses, and consistently throws ForbiddenError.
 */
function assertCanWriteProfile(role: Role, callerId: string, profileOwnerId: string): void {
  assertCanAny(role, ["hr:cv:write:own", "hr:cv:write:any"]);
  const scope = scopeToOwnerUnless(role, "hr:cv:write:any", callerId);
  if (scope.ownerId && scope.ownerId !== profileOwnerId) {
    throw new ForbiddenError("hr:cv:write:any");
  }
}

/** Throws a friendly error when a scoped deleteMany/updateMany affected zero rows — the id didn't belong to this profile, or never existed. */
function assertMutatedOne(count: number, message: string): void {
  if (count === 0) {
    throw new Error(message);
  }
}

/** Turns a unique-constraint violation (e.g. adding the same skill/language twice) into a friendly validation error instead of an unhandled Prisma exception. */
async function createUnique<T>(create: () => Promise<T>, duplicateMessage: string): Promise<T> {
  try {
    return await create();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error(duplicateMessage);
    }
    throw error;
  }
}

// ---- Profile (HR-1) -----------------------------------------------------

export async function upsertOwnEmployeeProfile(formData: FormData): Promise<void> {
  const { userId, role } = await requireSession();
  assertCanAny(role, ["hr:cv:write:own", "hr:cv:write:any"]);

  const profile = await prisma.employeeProfile.upsert({
    where: { ownerId: userId },
    create: {
      ownerId: userId,
      title: (formData.get("title") as string) || null,
      bio: (formData.get("bio") as string) || null,
    },
    update: {
      title: (formData.get("title") as string) || null,
      bio: (formData.get("bio") as string) || null,
    },
  });

  await recordAuditEntry({
    actorId: userId,
    actorRole: role,
    action: "hr.profile.upsert",
    resource: "EmployeeProfile",
    resourceId: profile.id,
  });

  revalidatePath("/hr");
  redirect("/hr");
}

export async function updateEmployeeProfileAsAdmin(targetUserId: string, formData: FormData): Promise<void> {
  const { userId, role } = await requireSession();
  assertCan(role, "hr:cv:write:any");

  const profile = await prisma.employeeProfile.upsert({
    where: { ownerId: targetUserId },
    create: {
      ownerId: targetUserId,
      title: (formData.get("title") as string) || null,
      bio: (formData.get("bio") as string) || null,
    },
    update: {
      title: (formData.get("title") as string) || null,
      bio: (formData.get("bio") as string) || null,
    },
  });

  // Logged distinctly from a self-edit — this is an Admin touching another
  // employee's PII, which the epic doc (NFR-PRIV) calls out for access logging.
  await recordAuditEntry({
    actorId: userId,
    actorRole: role,
    action: "hr.profile.upsert_any",
    resource: "EmployeeProfile",
    resourceId: profile.id,
    metadata: { targetUserId },
  });

  revalidatePath(`/hr/${targetUserId}`);
  redirect(`/hr/${targetUserId}`);
}

// ---- Skills / languages / projects (HR-1) --------------------------------

export async function addSkill(profileOwnerId: string, formData: FormData): Promise<void> {
  const { userId, role } = await requireSession();
  assertCanWriteProfile(role, userId, profileOwnerId);

  const profile = await prisma.employeeProfile.findUniqueOrThrow({ where: { ownerId: profileOwnerId } });
  await createUnique(
    () =>
      prisma.employeeSkill.create({
        data: {
          employeeProfileId: profile.id,
          category: formData.get("category") as SkillCategory,
          name: formData.get("name") as string,
          level: formData.get("level") as ExpertiseLevel,
        },
      }),
    "This skill is already on the profile",
  );

  await recordAuditEntry({ actorId: userId, actorRole: role, action: "hr.skill.add", resource: "EmployeeProfile", resourceId: profile.id });
  revalidatePath(`/hr/${profileOwnerId}`);
  revalidatePath("/hr");
}

export async function removeSkill(profileOwnerId: string, skillId: string): Promise<void> {
  const { userId, role } = await requireSession();
  assertCanWriteProfile(role, userId, profileOwnerId);

  // Scoped to the profile the caller is authorized to write, not just the
  // bare skillId — otherwise a hr:cv:write:own holder could pass another
  // employee's skillId and delete it (IDOR).
  const { count } = await prisma.employeeSkill.deleteMany({
    where: { id: skillId, employeeProfile: { ownerId: profileOwnerId } },
  });
  assertMutatedOne(count, "Skill not found on this profile");

  await recordAuditEntry({ actorId: userId, actorRole: role, action: "hr.skill.remove", resource: "EmployeeSkill", resourceId: skillId });
  revalidatePath(`/hr/${profileOwnerId}`);
  revalidatePath("/hr");
}

export async function addLanguage(profileOwnerId: string, formData: FormData): Promise<void> {
  const { userId, role } = await requireSession();
  assertCanWriteProfile(role, userId, profileOwnerId);

  const profile = await prisma.employeeProfile.findUniqueOrThrow({ where: { ownerId: profileOwnerId } });
  await createUnique(
    () =>
      prisma.employeeLanguage.create({
        data: {
          employeeProfileId: profile.id,
          name: formData.get("name") as string,
          proficiency: formData.get("proficiency") as LanguageProficiency,
        },
      }),
    "This language is already on the profile",
  );

  await recordAuditEntry({ actorId: userId, actorRole: role, action: "hr.language.add", resource: "EmployeeProfile", resourceId: profile.id });
  revalidatePath(`/hr/${profileOwnerId}`);
  revalidatePath("/hr");
}

export async function removeLanguage(profileOwnerId: string, languageId: string): Promise<void> {
  const { userId, role } = await requireSession();
  assertCanWriteProfile(role, userId, profileOwnerId);

  const { count } = await prisma.employeeLanguage.deleteMany({
    where: { id: languageId, employeeProfile: { ownerId: profileOwnerId } },
  });
  assertMutatedOne(count, "Language not found on this profile");

  await recordAuditEntry({ actorId: userId, actorRole: role, action: "hr.language.remove", resource: "EmployeeLanguage", resourceId: languageId });
  revalidatePath(`/hr/${profileOwnerId}`);
  revalidatePath("/hr");
}

export async function addProject(profileOwnerId: string, formData: FormData): Promise<void> {
  const { userId, role } = await requireSession();
  assertCanWriteProfile(role, userId, profileOwnerId);

  const profile = await prisma.employeeProfile.findUniqueOrThrow({ where: { ownerId: profileOwnerId } });
  const startedAtRaw = formData.get("startedAt") as string;
  const endedAtRaw = formData.get("endedAt") as string;
  await prisma.employeeProject.create({
    data: {
      employeeProfileId: profile.id,
      name: formData.get("name") as string,
      role: (formData.get("role") as string) || null,
      description: (formData.get("description") as string) || null,
      startedAt: startedAtRaw ? new Date(startedAtRaw) : null,
      endedAt: endedAtRaw ? new Date(endedAtRaw) : null,
    },
  });

  await recordAuditEntry({ actorId: userId, actorRole: role, action: "hr.project.add", resource: "EmployeeProfile", resourceId: profile.id });
  revalidatePath(`/hr/${profileOwnerId}`);
  revalidatePath("/hr");
}

export async function updateProject(profileOwnerId: string, projectId: string, formData: FormData): Promise<void> {
  const { userId, role } = await requireSession();
  assertCanWriteProfile(role, userId, profileOwnerId);

  const startedAtRaw = formData.get("startedAt") as string;
  const endedAtRaw = formData.get("endedAt") as string;
  const { count } = await prisma.employeeProject.updateMany({
    where: { id: projectId, employeeProfile: { ownerId: profileOwnerId } },
    data: {
      name: formData.get("name") as string,
      role: (formData.get("role") as string) || null,
      description: (formData.get("description") as string) || null,
      startedAt: startedAtRaw ? new Date(startedAtRaw) : null,
      endedAt: endedAtRaw ? new Date(endedAtRaw) : null,
    },
  });
  assertMutatedOne(count, "Project not found on this profile");

  await recordAuditEntry({ actorId: userId, actorRole: role, action: "hr.project.update", resource: "EmployeeProject", resourceId: projectId });
  revalidatePath(`/hr/${profileOwnerId}`);
  revalidatePath("/hr");
}

export async function removeProject(profileOwnerId: string, projectId: string): Promise<void> {
  const { userId, role } = await requireSession();
  assertCanWriteProfile(role, userId, profileOwnerId);

  const { count } = await prisma.employeeProject.deleteMany({
    where: { id: projectId, employeeProfile: { ownerId: profileOwnerId } },
  });
  assertMutatedOne(count, "Project not found on this profile");

  await recordAuditEntry({ actorId: userId, actorRole: role, action: "hr.project.remove", resource: "EmployeeProject", resourceId: projectId });
  revalidatePath(`/hr/${profileOwnerId}`);
  revalidatePath("/hr");
}
