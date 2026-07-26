import { auth } from "@/auth";
import { assertCan } from "@codea-srm/core";
import { generateProformaInvoice } from "../../../actions";

const LINE_ITEM_ROWS = 5;

export default async function NewProformaInvoicePage() {
  const session = await auth();
  assertCan(session!.user.role, "finance:write");

  return (
    <section>
      <h1>New proforma invoice</h1>
      <form action={generateProformaInvoice}>
        <div>
          <label>
            Client name
            <input name="clientName" required />
          </label>
        </div>
        <div>
          <label>
            Client ЕИК/Булстат
            <input name="clientTaxId" />
          </label>
        </div>
        <div>
          <label>
            Issue date
            <input name="issueDate" type="date" required />
          </label>
        </div>
        <div>
          <label>
            Due date
            <input name="dueDate" type="date" />
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
            VAT rate %
            <input name="vatRatePercent" type="number" step="0.01" defaultValue="20" required />
          </label>
        </div>
        <h2>Line items</h2>
        {Array.from({ length: LINE_ITEM_ROWS }, (_, i) => (
          <div key={i}>
            <input name={`item${i}_description`} placeholder="Description" />
            <input name={`item${i}_quantity`} type="number" step="1" placeholder="Qty" />
            <input name={`item${i}_unitPrice`} type="number" step="0.01" placeholder="Unit price" />
          </div>
        ))}
        <button type="submit">Generate PDF</button>
      </form>
    </section>
  );
}
