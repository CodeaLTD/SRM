import Link from "next/link";
import { auth } from "@/auth";
import { assertCan } from "@codea-srm/core";
import { prisma } from "@codea-srm/db";

// FIN-1 — generated receipts / advance reports / proforma invoices.
export default async function DocumentsPage() {
  const session = await auth();
  assertCan(session!.user.role, "finance:read");

  const documents = await prisma.generatedDocument.findMany({ orderBy: { createdAt: "desc" }, take: 50 });

  return (
    <section>
      <h1>Documents</h1>
      <nav>
        <Link href="/finance/documents/new/receipt">New receipt</Link>
        {" · "}
        <Link href="/finance/documents/new/advance-report">New advance report</Link>
        {" · "}
        <Link href="/finance/documents/new/proforma-invoice">New proforma invoice</Link>
      </nav>
      <table>
        <thead>
          <tr>
            <th>Number</th>
            <th>Type</th>
            <th>Created</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {documents.map((d) => (
            <tr key={d.id}>
              <td>{d.documentNumber}</td>
              <td>{d.documentType}</td>
              <td>{d.createdAt.toDateString()}</td>
              <td>
                <a href={`/api/finance/documents/${d.id}/download`}>Download</a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
