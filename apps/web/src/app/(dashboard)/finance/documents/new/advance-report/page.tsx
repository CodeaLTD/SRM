import { auth } from "@/auth";
import { assertCan } from "@codea-srm/core";
import { generateAdvanceReport } from "../../../actions";

const LINE_ITEM_ROWS = 5;

// авансови отчети (FIN-1).
export default async function NewAdvanceReportPage() {
  const session = await auth();
  assertCan(session!.user.role, "finance:write");

  return (
    <section>
      <h1>New advance report</h1>
      <form action={generateAdvanceReport}>
        <div>
          <label>
            Employee name
            <input name="employeeName" required />
          </label>
        </div>
        <div>
          <label>
            Purpose
            <input name="purpose" required />
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
        <div>
          <label>
            Advance received
            <input name="advanceAmount" type="number" step="0.01" required />
          </label>
        </div>
        <h2>Spent items</h2>
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
