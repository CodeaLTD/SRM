import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Transpile the shared workspace packages instead of requiring them to
  // pre-build — keeps dev loop fast across the monorepo boundary.
  transpilePackages: ["@codea-srm/core", "@codea-srm/db"],
  experimental: {
    // Next's default Server Action body limit is 1MB, well under
    // MAX_SUPPLIER_INVOICE_SIZE_BYTES (20MB, see
    // packages/core/src/finance/upload-validation.ts) — without this,
    // Next itself 413s any upload over 1MB before uploadSupplierInvoice
    // ever runs, so the validator's friendly error never fires and the
    // stated 20MB limit is unreachable. Keep these two numbers in sync.
    serverActions: { bodySizeLimit: "20mb" },
  },
};

export default nextConfig;
