import { auth } from "@/auth";
import { assertCan } from "@codea-srm/core";
import { uploadSupplierInvoice } from "../../actions";

// FIN-4/5 shell — file is stored and a "За проверка" transaction is
// created with every extraction field blank (FIN-3/OCR is out of scope
// for this delivery, see packages/core/src/finance/extraction.ts). The
// reviewer fills every field in by hand on the next screen.
export default async function UploadSupplierInvoicePage() {
  const session = await auth();
  assertCan(session!.user.role, "finance:write");

  return (
    <section>
      <h1>Upload supplier invoice</h1>
      <p>The file is stored for reference; nothing is auto-extracted — you&apos;ll fill in the details on the next screen.</p>
      <form action={uploadSupplierInvoice} encType="multipart/form-data">
        <div>
          <label>
            Invoice file (PDF/image)
            <input name="file" type="file" accept="application/pdf,image/*" required />
          </label>
        </div>
        <button type="submit">Upload</button>
      </form>
    </section>
  );
}
