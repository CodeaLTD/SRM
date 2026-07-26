import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { assertCan, readFile, sanitizeFilenameForHeader } from "@codea-srm/core";
import { prisma } from "@codea-srm/db";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  assertCan(session.user.role, "finance:read");

  const { id } = await params;
  const document = await prisma.generatedDocument.findUnique({ where: { id } });
  if (!document) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const buffer = await readFile(document.storageKey);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${sanitizeFilenameForHeader(document.documentNumber)}.pdf"`,
    },
  });
}
