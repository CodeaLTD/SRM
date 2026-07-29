import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { can, readFile, sanitizeFilenameForHeader } from "@codea-srm/core";
import { prisma } from "@codea-srm/db";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const document = await prisma.generatedDocument.findUnique({
    where: { id },
    include: { instruction: true },
  });
  if (!document || document.documentType !== "INSTRUCTION_DECLARATION") {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const isOwnInstruction = document.instruction?.employeeId === session.user.id;
  if (!can(session.user.role, "osh:register:manage") && !isOwnInstruction) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const buffer = await readFile(document.storageKey);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${sanitizeFilenameForHeader(document.documentNumber)}.pdf"`,
    },
  });
}
