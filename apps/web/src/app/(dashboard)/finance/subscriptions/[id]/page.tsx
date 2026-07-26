import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { assertCan } from "@codea-srm/core";
import { prisma } from "@codea-srm/db";
import { updateSubscription } from "../../actions";

export default async function EditSubscriptionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  assertCan(session!.user.role, "finance:write");

  const subscription = await prisma.subscription.findUnique({ where: { id } });
  if (!subscription) notFound();

  const boundUpdate = updateSubscription.bind(null, id);

  return (
    <section>
      <h1>Edit subscription</h1>
      <form action={boundUpdate}>
        <div>
          <label>
            Name
            <input name="name" defaultValue={subscription.name} required />
          </label>
        </div>
        <div>
          <label>
            URL
            <input name="url" type="url" defaultValue={subscription.url ?? ""} />
          </label>
        </div>
        <div>
          <label>
            Vendor
            <input name="vendor" defaultValue={subscription.vendor ?? ""} />
          </label>
        </div>
        <div>
          <label>
            Monthly fee
            <input name="feeAmount" type="number" step="0.01" defaultValue={(subscription.feeAmountMinor / 100).toFixed(2)} required />
          </label>
        </div>
        <div>
          <label>
            Currency
            <input name="currency" defaultValue={subscription.currency} required />
          </label>
        </div>
        <div>
          <label>
            Billing interval (days)
            <input name="billingIntervalDays" type="number" min="1" step="1" defaultValue={subscription.billingIntervalDays} required />
          </label>
        </div>
        <div>
          <label>
            Next renewal date
            <input name="renewsAt" type="date" defaultValue={subscription.renewsAt.toISOString().slice(0, 10)} required />
          </label>
        </div>
        <div>
          <label>
            Alert lead time (days)
            <input name="alertLeadDays" type="number" defaultValue={subscription.alertLeadDays} required />
          </label>
        </div>
        <button type="submit">Save</button>
      </form>
    </section>
  );
}
