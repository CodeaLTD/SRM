import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { assertCan } from "@codea-srm/core";
import { prisma } from "@codea-srm/db";
import { deleteContact } from "../../actions";

// A one-click delete has no undo (Contact has no soft-delete), and this app
// has no client components to add a confirm() dialog to — so the
// confirmation is a full extra page/click instead, matching the
// zero-client-JS constraint the rest of the app follows.
export default async function DeleteContactPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  assertCan(session!.user.role, "crm:write");

  const contact = await prisma.contact.findUnique({ where: { id } });
  if (!contact) notFound();

  const boundDelete = deleteContact.bind(null, contact.id);

  return (
    <section>
      <h1>Delete contact</h1>
      <p>
        Are you sure you want to permanently delete <strong>{contact.fullName}</strong>? This cannot be undone.
      </p>
      <form action={boundDelete}>
        <button type="submit">Yes, delete this contact</button>
      </form>
      <p>
        <Link href={`/crm/${contact.id}/edit`}>Cancel</Link>
      </p>
    </section>
  );
}
