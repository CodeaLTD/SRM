import Link from "next/link";
import { auth } from "@/auth";
import { assertCan } from "@codea-srm/core";
import { prisma } from "@codea-srm/db";

type SortKey = "name" | "company";

function buildUrl(params: { tag?: string; sort?: SortKey }): string {
  const query = new URLSearchParams();
  if (params.tag) query.set("tag", params.tag);
  if (params.sort) query.set("sort", params.sort);
  const qs = query.toString();
  return qs ? `/crm?${qs}` : "/crm";
}

// Epic CRM — Admin + Sales only (PRD §6); Analyst/User have no access.
// No ownership scoping: everyone who can read/write CRM shares one
// company-wide contact list (PRD: "company knowledge", not per-user data).
export default async function CrmPage({ searchParams }: { searchParams: Promise<{ tag?: string; sort?: string }> }) {
  const { tag, sort: sortRaw } = await searchParams;
  const sort: SortKey = sortRaw === "company" ? "company" : "name";
  const session = await auth();
  const role = session!.user.role;
  assertCan(role, "crm:read");

  const [contacts, allContacts] = await Promise.all([
    prisma.contact.findMany({
      where: tag ? { tags: { has: tag } } : undefined,
      orderBy: sort === "company" ? [{ company: "asc" }, { fullName: "asc" }] : { fullName: "asc" },
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
              <Link href={buildUrl({ tag: t, sort })}>{t}</Link>
            </span>
          ))}
          {tag && (
            <>
              {" · "}
              <Link href={buildUrl({ sort })}>Clear filter</Link>
            </>
          )}
        </p>
      )}
      <p>
        Sort by:{" "}
        {sort === "name" ? <strong>Name</strong> : <Link href={buildUrl({ tag, sort: "name" })}>Name</Link>}
        {" · "}
        {sort === "company" ? <strong>Company</strong> : <Link href={buildUrl({ tag, sort: "company" })}>Company</Link>}
      </p>
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
