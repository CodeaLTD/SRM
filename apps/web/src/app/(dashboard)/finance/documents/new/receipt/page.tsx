import { auth } from "@/auth";
import { assertCan } from "@codea-srm/core";
import { generateReceipt } from "../../../actions";

const LINE_ITEM_ROWS = 5;

export default async function NewReceiptPage() {
  const session = await auth();
  assertCan(session!.user.role, "finance:write");

  return (
    <section>
      <h1>New receipt</h1>
      <form action={generateReceipt}>
        <div>
          <label>
            Recipient name
            <input name="recipientName" required />
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
            Currency
            <input name="currency" defaultValue="BGN" required />
          </label>
        </div>
        <h2>Line items</h2>
        {Array.from({ length: LINE_ITEM_ROWS }, (_, i) => (
          <div key={i}>
            <input name={`item${i}_description`} placeholder="Description" />
            <input name={`item${i}_amount`} type="number" step="0.01" placeholder="Amount" />
          </div>
        ))}
        <button type="submit">Generate PDF</button>
      </form>
    </section>
  );
}
