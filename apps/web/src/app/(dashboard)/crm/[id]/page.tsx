import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { assertCan } from "@codea-srm/core";
import { prisma } from "@codea-srm/db";

export default async function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  assertCan(session!.user.role, "crm:read");

  const contact = await prisma.contact.findUnique({ where: { id } });
  if (!contact) notFound();

  return (
    <section>
      <h1>{contact.fullName}</h1>
      <p>
        <Link href="/crm">Back to contacts</Link>
        {" · "}
        <Link href={`/crm/${contact.id}/edit`}>Edit</Link>
      </p>
      <dl>
        <dt>Position</dt>
        <dd>{contact.position ?? "—"}</dd>
        <dt>Company</dt>
        <dd>{contact.company ?? "—"}</dd>
        <dt>Phone</dt>
        <dd>{contact.phone ?? "—"}</dd>
        <dt>Email</dt>
        <dd>{contact.email ?? "—"}</dd>
        <dt>LinkedIn</dt>
        <dd>{contact.linkedInUrl ?? "—"}</dd>
        <dt>Tags</dt>
        <dd>{contact.tags.join(", ") || "—"}</dd>
        <dt>Notes</dt>
        <dd style={{ whiteSpace: "pre-wrap" }}>{contact.notes ?? "—"}</dd>
      </dl>
    </section>
  );
}
