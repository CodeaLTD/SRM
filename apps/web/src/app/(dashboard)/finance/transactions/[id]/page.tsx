import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { assertCan, formatMinorAmount } from "@codea-srm/core";
import { prisma } from "@codea-srm/db";
import { confirmTransaction, updateTransactionDraft, voidTransaction } from "../../actions";

function toDateInputValue(date: Date | null): string {
  return date ? date.toISOString().slice(0, 10) : "";
}

// FIN-4/5 shell: review/correct/confirm screen. Every field here was left
// blank by the (unimplemented) FIN-3 extraction step and must be filled
// in by hand before the transaction can be confirmed onto the ledger.
export default async function TransactionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  assertCan(session!.user.role, "finance:read");

  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: { sourceDocument: true },
  });
  if (!transaction) notFound();

  const boundUpdate = updateTransactionDraft.bind(null, id);
  const boundConfirm = confirmTransaction.bind(null, id);
  const boundVoid = voidTransaction.bind(null, id);

  if (transaction.status !== "FOR_REVIEW") {
    return (
      <section>
        <h1>Transaction</h1>
        <p>Status: {transaction.status}</p>
        <dl>
          <dt>Supplier</dt>
          <dd>{transaction.supplierName ?? "—"}</dd>
          <dt>Amount</dt>
          <dd>{transaction.amountMinor !== null ? formatMinorAmount(transaction.amountMinor, transaction.currency) : "—"}</dd>
          <dt>Date</dt>
          <dd>{transaction.issueDate?.toDateString() ?? "—"}</dd>
        </dl>
        {transaction.status === "CONFIRMED" && (
          <form action={boundVoid}>
            <button type="submit">Void</button>
          </form>
        )}
      </section>
    );
  }

  return (
    <section>
      <h1>Review invoice — За проверка</h1>
      {transaction.sourceDocument && (
        <p>
          Source file: <a href={`/api/finance/uploads/${transaction.sourceDocument.id}`}>{transaction.sourceDocument.originalName}</a>
        </p>
      )}
      <form action={boundUpdate}>
        <div>
          <label>
            Supplier name
            <input name="supplierName" defaultValue={transaction.supplierName ?? ""} />
          </label>
        </div>
        <div>
          <label>
            ЕИК/Булстат
            <input name="supplierTaxId" defaultValue={transaction.supplierTaxId ?? ""} />
          </label>
        </div>
        <div>
          <label>
            Amount
            <input
              name="amount"
              type="number"
              step="0.01"
              defaultValue={transaction.amountMinor !== null ? (transaction.amountMinor / 100).toFixed(2) : ""}
            />
          </label>
        </div>
        <div>
          <label>
            VAT amount
            <input
              name="vatAmount"
              type="number"
              step="0.01"
              defaultValue={transaction.vatAmountMinor !== null ? (transaction.vatAmountMinor / 100).toFixed(2) : ""}
            />
          </label>
        </div>
        <div>
          <label>
            Currency
            <input name="currency" defaultValue={transaction.currency} />
          </label>
        </div>
        <div>
          <label>
            Issue date
            <input name="issueDate" type="date" defaultValue={toDateInputValue(transaction.issueDate)} />
          </label>
        </div>
        <div>
          <label>
            Description
            <input name="description" defaultValue={transaction.description ?? ""} />
          </label>
        </div>
        <button type="submit">Save draft</button>
      </form>
      <form action={boundConfirm}>
        <button type="submit">Confirm</button>
      </form>
    </section>
  );
}
