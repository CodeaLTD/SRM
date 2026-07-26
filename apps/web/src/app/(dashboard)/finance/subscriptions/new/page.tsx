import { auth } from "@/auth";
import { assertCan } from "@codea-srm/core";
import { createSubscription } from "../../actions";

export default async function NewSubscriptionPage() {
  const session = await auth();
  assertCan(session!.user.role, "finance:write");

  return (
    <section>
      <h1>New subscription</h1>
      <form action={createSubscription}>
        <div>
          <label>
            Name
            <input name="name" required />
          </label>
        </div>
        <div>
          <label>
            URL
            <input name="url" type="url" />
          </label>
        </div>
        <div>
          <label>
            Vendor
            <input name="vendor" />
          </label>
        </div>
        <div>
          <label>
            Monthly fee
            <input name="feeAmount" type="number" step="0.01" required />
          </label>
        </div>
        <div>
          <label>
            Currency
            <input name="currency" defaultValue="EUR" required />
          </label>
        </div>
        <div>
          <label>
            Billing interval (days)
            <input name="billingIntervalDays" type="number" min="1" step="1" defaultValue="30" required />
          </label>
        </div>
        <div>
          <label>
            Next renewal date
            <input name="renewsAt" type="date" required />
          </label>
        </div>
        <div>
          <label>
            Alert lead time (days)
            <input name="alertLeadDays" type="number" defaultValue="7" required />
          </label>
        </div>
        <button type="submit">Save</button>
      </form>
    </section>
  );
}
