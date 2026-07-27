import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { assertCanAny, can, ForbiddenError } from "@codea-srm/core";
import { prisma } from "@codea-srm/db";
import { updateEmployeeProfileAsAdmin, upsertOwnEmployeeProfile } from "../actions";

export default async function EmployeeProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId: targetUserId } = await params;
  const session = await auth();
  const role = session!.user.role;
  const viewerId = session!.user.id;
  const isSelf = viewerId === targetUserId;

  // Thrown explicitly here (rather than left to propagate) because this
  // check depends on isSelf, which the coarse middleware route gate can't
  // encode — an uncaught ForbiddenError would otherwise surface as an
  // unhandled 500 instead of a clean redirect (e.g. a USER, who only holds
  // hr:cv:write:own, navigating directly to another employee's /hr/{id}).
  try {
    assertCanAny(role, isSelf ? ["hr:cv:read", "hr:cv:write:own"] : ["hr:cv:read"]);
  } catch (error) {
    if (error instanceof ForbiddenError) redirect("/403");
    throw error;
  }

  const profile = await prisma.employeeProfile.findUnique({
    where: { ownerId: targetUserId },
    include: { owner: true, skills: true, languages: true, projects: true },
  });
  if (!profile) notFound();

  // canEdit must check an actual write capability, not just isSelf — a SALES
  // viewer (hr:cv:read only) or any role lacking write:own/write:any must
  // stay read-only on their own profile too. Self-edits always route through
  // upsertOwnEmployeeProfile (even for an Admin editing their own CV) so the
  // audit trail logs a plain "upsert", not "upsert_any" — that action is
  // reserved for an Admin genuinely touching someone else's PII.
  const canEditOwn = isSelf && (can(role, "hr:cv:write:own") || can(role, "hr:cv:write:any"));
  const canEditAny = !isSelf && can(role, "hr:cv:write:any");
  const canEdit = canEditOwn || canEditAny;
  const boundUpdate = canEditAny ? updateEmployeeProfileAsAdmin.bind(null, targetUserId) : upsertOwnEmployeeProfile;

  return (
    <section>
      <h1>{profile.owner.name ?? profile.owner.email}</h1>
      {canEdit ? (
        <form action={boundUpdate}>
          <div>
            <label>
              Title
              <input name="title" defaultValue={profile.title ?? ""} />
            </label>
          </div>
          <div>
            <label>
              Bio
              <textarea name="bio" defaultValue={profile.bio ?? ""} />
            </label>
          </div>
          <button type="submit">Save</button>
        </form>
      ) : (
        <>
          <p>{profile.title ?? "—"}</p>
          <p>{profile.bio ?? "—"}</p>
        </>
      )}

      <h2>Skills</h2>
      <ul>
        {profile.skills.map((skill) => (
          <li key={skill.id}>
            {skill.category}: {skill.name} ({skill.level})
          </li>
        ))}
      </ul>

      <h2>Languages</h2>
      <ul>
        {profile.languages.map((language) => (
          <li key={language.id}>
            {language.name} ({language.proficiency})
          </li>
        ))}
      </ul>

      <h2>Internal projects</h2>
      <ul>
        {profile.projects.map((project) => (
          <li key={project.id}>
            {project.name} {project.role ? `(${project.role})` : ""} — {project.description ?? "—"}
          </li>
        ))}
      </ul>
    </section>
  );
}
