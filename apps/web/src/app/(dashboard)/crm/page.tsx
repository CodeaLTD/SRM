import Link from "next/link";
import { auth } from "@/auth";
import { assertCan } from "@codea-srm/core";
import { prisma } from "@codea-srm/db";

// Epic CRM — Admin + Sales only (PRD §6); Analyst/User have no access.
// No ownership scoping: everyone who can read/write CRM shares one
// company-wide contact list (PRD: "company knowledge", not per-user data).
export default async function CrmPage({ searchParams }: { searchParams: Promise<{ tag?: string }> }) {
  const { tag } = await searchParams;
  const session = await auth();
  const role = session!.user.role;
  assertCan(role, "crm:read");

  const [contacts, allContacts] = await Promise.all([
    prisma.contact.findMany({
      where: tag ? { tags: { has: tag } } : undefined,
      orderBy: { fullName: "asc" },
    }),
    // Only needed to build the filter list below — cheap at this dataset size.
    prisma.contact.findMany({ select: { tags: true } }),
  ]);

  const allTags = [...new Set(allContacts.flatMap((contact) => contact.tags))].sort();

  return (
    <section>
      <h1>Business Network (CRM)</h1>
      <p>
        <Link href="/crm/new">New contact</Link>
      </p>
      {allTags.length > 0 && (
        <p>
          Filter by tag:{" "}
          {allTags.map((t, i) => (
            <span key={t}>
              {i > 0 && " · "}
              <Link href={`/crm?tag=${encodeURIComponent(t)}`}>{t}</Link>
            </span>
          ))}
          {tag && (
            <>
              {" · "}
              <Link href="/crm">Clear filter</Link>
            </>
          )}
        </p>
      )}
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Company / Position</th>
            <th>Tags</th>
          </tr>
        </thead>
        <tbody>
          {contacts.map((contact) => (
            <tr key={contact.id}>
              <td>
                <Link href={`/crm/${contact.id}`}>{contact.fullName}</Link>
              </td>
              <td>{[contact.position, contact.company].filter(Boolean).join(" at ") || "—"}</td>
              <td>{contact.tags.join(", ") || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
