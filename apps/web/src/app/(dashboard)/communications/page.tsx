import { auth } from "@/auth";

// Epic COMM — scheduled emails + queue dashboard (COMM-2/3). No dedicated
// capability yet; every authenticated role can view their own queue once
// the Notification model exists.
export default async function CommunicationsPage() {
  await auth();

  return (
    <section>
      <h1>Communications</h1>
      <p>Scheduled emails queue (COMM-2/3) — not yet implemented.</p>
    </section>
  );
}
