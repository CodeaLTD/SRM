import Link from "next/link";
import { auth } from "@/auth";
import { assertCanAny, can } from "@codea-srm/core";
import { prisma } from "@codea-srm/db";
import { addLanguage, addProject, addSkill, removeLanguage, removeProject, removeSkill, upsertOwnEmployeeProfile } from "./actions";

// Epic HR — Admin/Sales see the full skills matrix (hr:cv:read); User sees/
// edits only their own CV (hr:cv:write:own, scoped via ownerId) — the route
// admits User, so the page must accept either capability, not just the
// "read everyone's" one.
export default async function HrPage() {
  const session = await auth();
  const role = session!.user.role;
  const userId = session!.user.id;
  assertCanAny(role, ["hr:cv:read", "hr:cv:write:own"]);

  const canReadAll = can(role, "hr:cv:read");
  const canWriteOwn = can(role, "hr:cv:write:own") || can(role, "hr:cv:write:any");

  const ownProfile = canWriteOwn
    ? await prisma.employeeProfile.findUnique({
        where: { ownerId: userId },
        include: { skills: true, languages: true, projects: true },
      })
    : null;

  const directory = canReadAll
    ? await prisma.employeeProfile.findMany({
        include: { owner: true, skills: true },
        orderBy: { updatedAt: "desc" },
      })
    : [];

  const boundAddSkill = addSkill.bind(null, userId);
  const boundAddLanguage = addLanguage.bind(null, userId);
  const boundAddProject = addProject.bind(null, userId);

  return (
    <section>
      <h1>HR &amp; Skills Matrix</h1>

      {canReadAll && (
        <>
          <h2>Directory</h2>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Title</th>
                <th>Skills</th>
              </tr>
            </thead>
            <tbody>
              {directory.map((profile) => (
                <tr key={profile.id}>
                  <td>
                    <Link href={`/hr/${profile.ownerId}`}>{profile.owner.name ?? profile.owner.email}</Link>
                  </td>
                  <td>{profile.title ?? "—"}</td>
                  <td>{profile.skills.map((skill) => skill.name).join(", ") || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {canWriteOwn && (
        <>
          <h2>My CV</h2>
          <form action={upsertOwnEmployeeProfile}>
            <div>
              <label>
                Title
                <input name="title" defaultValue={ownProfile?.title ?? ""} />
              </label>
            </div>
            <div>
              <label>
                Bio
                <textarea name="bio" defaultValue={ownProfile?.bio ?? ""} />
              </label>
            </div>
            <button type="submit">Save</button>
          </form>

          {ownProfile && (
            <>
              <h3>Skills</h3>
              <ul>
                {ownProfile.skills.map((skill) => (
                  <li key={skill.id}>
                    {skill.category}: {skill.name} ({skill.level})
                    <form action={removeSkill.bind(null, userId, skill.id)} style={{ display: "inline" }}>
                      <button type="submit">Remove</button>
                    </form>
                  </li>
                ))}
              </ul>
              <form action={boundAddSkill}>
                <select name="category" defaultValue="STACK">
                  <option value="STACK">Stack</option>
                  <option value="DOMAIN">Domain</option>
                </select>
                <input name="name" placeholder="e.g. TypeScript" required />
                <select name="level" defaultValue="INTERMEDIATE">
                  <option value="BEGINNER">Beginner</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Advanced</option>
                  <option value="EXPERT">Expert</option>
                </select>
                <button type="submit">Add skill</button>
              </form>

              <h3>Languages</h3>
              <ul>
                {ownProfile.languages.map((language) => (
                  <li key={language.id}>
                    {language.name} ({language.proficiency})
                    <form action={removeLanguage.bind(null, userId, language.id)} style={{ display: "inline" }}>
                      <button type="submit">Remove</button>
                    </form>
                  </li>
                ))}
              </ul>
              <form action={boundAddLanguage}>
                <input name="name" placeholder="e.g. English" required />
                <select name="proficiency" defaultValue="CONVERSATIONAL">
                  <option value="BASIC">Basic</option>
                  <option value="CONVERSATIONAL">Conversational</option>
                  <option value="FLUENT">Fluent</option>
                  <option value="NATIVE">Native</option>
                </select>
                <button type="submit">Add language</button>
              </form>

              <h3>Internal projects</h3>
              <ul>
                {ownProfile.projects.map((project) => (
                  <li key={project.id}>
                    {project.name} {project.role ? `(${project.role})` : ""}
                    <form action={removeProject.bind(null, userId, project.id)} style={{ display: "inline" }}>
                      <button type="submit">Remove</button>
                    </form>
                  </li>
                ))}
              </ul>
              <form action={boundAddProject}>
                <input name="name" placeholder="Project name" required />
                <input name="role" placeholder="Your role" />
                <textarea name="description" placeholder="Description" />
                <label>
                  Started
                  <input name="startedAt" type="date" />
                </label>
                <label>
                  Ended
                  <input name="endedAt" type="date" />
                </label>
                <button type="submit">Add project</button>
              </form>
            </>
          )}
          {!ownProfile && <p>Save your title/bio above first to unlock skills, languages, and projects.</p>}
        </>
      )}
    </section>
  );
}
