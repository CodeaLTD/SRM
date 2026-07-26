import Link from "next/link";
import { auth } from "@/auth";
import { assertCan, formatMinorAmount } from "@codea-srm/core";
import { prisma } from "@codea-srm/db";

// Epic FIN — Admin + Analyst only (PRD §6). Middleware already blocks
// Sales/User at the route level; this is the data-layer check (NFR-AUTHZ).
export default async function FinancePage() {
  const session = await auth();
  assertCan(session!.user.role, "finance:read");

  const transactions = await prisma.transaction.findMany({
    where: { status: { not: "VOID" } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <section>
      <h1>Finance &amp; Documents</h1>
      <nav>
        <Link href="/finance/transactions/new">New transaction</Link>
        {" · "}
        <Link href="/finance/transactions/upload">Upload supplier invoice</Link>
        {" · "}
        <Link href="/finance/documents">Documents</Link>
        {" · "}
        <Link href="/finance/subscriptions">Subscriptions</Link>
      </nav>

      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Status</th>
            <th>Category</th>
            <th>Supplier</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t) => (
            <tr key={t.id}>
              <td>{t.issueDate ? t.issueDate.toDateString() : "—"}</td>
              <td>{t.type}</td>
              <td>
                {t.status === "FOR_REVIEW" ? (
                  <Link href={`/finance/transactions/${t.id}`}>За проверка</Link>
                ) : (
                  t.status
                )}
              </td>
              <td>{t.category ?? "—"}</td>
              <td>{t.supplierName ?? "—"}</td>
              <td>{t.amountMinor !== null ? formatMinorAmount(t.amountMinor, t.currency) : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
