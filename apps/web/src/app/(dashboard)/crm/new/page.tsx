import { auth } from "@/auth";
import { assertCan } from "@codea-srm/core";
import { createContact } from "../actions";

export default async function NewContactPage() {
  const session = await auth();
  assertCan(session!.user.role, "crm:write");

  return (
    <section>
      <h1>New contact</h1>
      <form action={createContact}>
        <div>
          <label>
            Full name
            <input name="fullName" required />
          </label>
        </div>
        <div>
          <label>
            Position
            <input name="position" />
          </label>
        </div>
        <div>
          <label>
            Company
            <input name="company" />
          </label>
        </div>
        <div>
          <label>
            Phone
            <input name="phone" />
          </label>
        </div>
        <div>
          <label>
            Email
            <input name="email" type="email" />
          </label>
        </div>
        <div>
          <label>
            LinkedIn
            <input name="linkedInUrl" />
          </label>
        </div>
        <div>
          <label>
            Notes
            <textarea name="notes" />
          </label>
        </div>
        <div>
          <label>
            Tags (comma-separated)
            <input name="tags" placeholder="key client, potential partner" />
          </label>
        </div>
        <button type="submit">Create contact</button>
      </form>
    </section>
  );
}
