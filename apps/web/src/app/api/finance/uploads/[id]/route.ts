import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { ALLOWED_SUPPLIER_INVOICE_MIME_TYPES, assertCan, readFile, sanitizeFilenameForHeader } from "@codea-srm/core";
import { prisma } from "@codea-srm/db";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  assertCan(session.user.role, "finance:read");

  const { id } = await params;
  const document = await prisma.uploadedDocument.findUnique({ where: { id } });
  if (!document) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const buffer = await readFile(document.storageKey);
  // document.mimeType is user-supplied at upload time. It's validated
  // against the allow-list before being written (see
  // finance/upload-validation.ts), but this route re-checks it and falls
  // back to a generic binary type rather than trusting the stored value —
  // serving an unvalidated Content-Type back to the browser is how a
  // spoofed upload turns into stored XSS. "attachment" (never "inline")
  // for the same reason: this is untrusted user content, so it should
  // always download rather than render in-origin.
  const contentType = ALLOWED_SUPPLIER_INVOICE_MIME_TYPES.has(document.mimeType)
    ? document.mimeType
    : "application/octet-stream";

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${sanitizeFilenameForHeader(document.originalName)}"`,
    },
  });
}
