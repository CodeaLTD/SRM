import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { assertCan } from "@codea-srm/core";
import { prisma } from "@codea-srm/db";
import { deleteContact, updateContact } from "../../actions";

export default async function EditContactPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  assertCan(session!.user.role, "crm:write");

  const contact = await prisma.contact.findUnique({ where: { id } });
  if (!contact) notFound();

  const boundUpdate = updateContact.bind(null, contact.id);
  const boundDelete = deleteContact.bind(null, contact.id);

  return (
    <section>
      <h1>Edit contact</h1>
      <form action={boundUpdate}>
        <div>
          <label>
            Full name
            <input name="fullName" defaultValue={contact.fullName} required />
          </label>
        </div>
        <div>
          <label>
            Position
            <input name="position" defaultValue={contact.position ?? ""} />
          </label>
        </div>
        <div>
          <label>
            Company
            <input name="company" defaultValue={contact.company ?? ""} />
          </label>
        </div>
        <div>
          <label>
            Phone
            <input name="phone" defaultValue={contact.phone ?? ""} />
          </label>
        </div>
        <div>
          <label>
            Email
            <input name="email" type="email" defaultValue={contact.email ?? ""} />
          </label>
        </div>
        <div>
          <label>
            LinkedIn
            <input name="linkedInUrl" defaultValue={contact.linkedInUrl ?? ""} />
          </label>
        </div>
        <div>
          <label>
            Notes
            <textarea name="notes" defaultValue={contact.notes ?? ""} />
          </label>
        </div>
        <div>
          <label>
            Tags (comma-separated)
            <input name="tags" defaultValue={contact.tags.join(", ")} />
          </label>
        </div>
        <button type="submit">Save changes</button>
      </form>

      <form action={boundDelete}>
        <button type="submit">Delete contact</button>
      </form>
    </section>
  );
}
