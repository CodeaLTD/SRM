import Link from "next/link";
import { auth } from "@/auth";
import { assertCan, formatMinorAmount } from "@codea-srm/core";
import { prisma } from "@codea-srm/db";
import { unsubscribe } from "../actions";

// FIN-6/7 — subscription registry + renewal alerting (worker-side daily
// scan in apps/worker/src/queues/subscription-renewal-alert.ts).
export default async function SubscriptionsPage() {
  const session = await auth();
  assertCan(session!.user.role, "finance:read");

  const subscriptions = await prisma.subscription.findMany({
    where: { unsubscribedAt: null },
    orderBy: { renewsAt: "asc" },
  });

  return (
    <section>
      <h1>Subscriptions</h1>
      <nav>
        <Link href="/finance/subscriptions/new">New subscription</Link>
      </nav>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Fee</th>
            <th>Renews</th>
            <th>Alert lead</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {subscriptions.map((s) => {
            const boundUnsubscribe = unsubscribe.bind(null, s.id);
            return (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td>{formatMinorAmount(s.feeAmountMinor, s.currency)}</td>
                <td>{s.renewsAt.toDateString()}</td>
                <td>{s.alertLeadDays} days</td>
                <td>
                  <Link href={`/finance/subscriptions/${s.id}`}>Edit</Link>{" "}
                  <form action={boundUnsubscribe} style={{ display: "inline" }}>
                    <button type="submit">Unsubscribe</button>
                  </form>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
