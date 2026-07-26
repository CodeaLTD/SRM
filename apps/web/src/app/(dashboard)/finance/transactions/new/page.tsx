import { auth } from "@/auth";
import { assertCan } from "@codea-srm/core";
import { createTransaction } from "../../actions";

// FIN-2 — manual income/expense entry; category is auto-suggested by
// packages/core/src/finance/categorization.ts server-side on submit.
export default async function NewTransactionPage() {
  const session = await auth();
  assertCan(session!.user.role, "finance:write");

  return (
    <section>
      <h1>New transaction</h1>
      <form action={createTransaction}>
        <div>
          <label>
            Type
            <select name="type" required defaultValue="EXPENSE">
              <option value="EXPENSE">Expense</option>
              <option value="INCOME">Income</option>
            </select>
          </label>
        </div>
        <div>
          <label>
            Amount
            <input name="amount" type="number" step="0.01" required />
          </label>
        </div>
        <div>
          <label>
            Currency
            <input name="currency" defaultValue="BGN" required />
          </label>
        </div>
        <div>
          <label>
            Date
            <input name="issueDate" type="date" required />
          </label>
        </div>
        <div>
          <label>
            Supplier / client name
            <input name="supplierName" />
          </label>
        </div>
        <div>
          <label>
            Description
            <input name="description" />
          </label>
        </div>
        <button type="submit">Save</button>
      </form>
    </section>
  );
}
