import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  assertCan,
  can,
  nextDocumentNumber,
  recordAuditEntry,
  renderInstructionDeclarationHtml,
  renderPdf,
  resolveClientIp,
  saveFile,
} from "@codea-srm/core";
import { prisma } from "@codea-srm/db";

/**
 * OSH-5/6: employee digital acknowledgement. A Route Handler rather than a
 * Server Action because OSH-6 requires logging the caller's IP address, and
 * Server Actions in this Next.js version have no reliable access to request
 * headers — see apps/web/src/app/api/finance/documents/[id]/download/route.ts
 * for the sibling pattern of a plain-form-POST-able Route Handler.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const role = session.user.role;
  assertCan(role, "osh:instruction:confirm:own");

  const { id } = await params;
  const instruction = await prisma.instruction.findUnique({
    where: { id },
    include: { employee: true, instructor: true },
  });
  if (!instruction) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  if (instruction.employeeId !== userId && !can(role, "osh:register:manage")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (instruction.confirmedAt) {
    return NextResponse.json({ error: "already confirmed" }, { status: 409 });
  }

  const confirmedAt = new Date();
  const confirmedIp = resolveClientIp(request);

  const documentNumber = await nextDocumentNumber("INSTRUCTION_DECLARATION");
  const html = renderInstructionDeclarationHtml({
    documentNumber,
    employeeName: instruction.employee.name ?? instruction.employee.email,
    instructionType: instruction.type,
    conductedAt: instruction.conductedAt.toDateString(),
    instructorName: instruction.instructor.name ?? instruction.instructor.email,
    confirmedAt: confirmedAt.toISOString(),
    confirmedIp,
  });
  const pdf = await renderPdf({ html });
  const { storageKey } = await saveFile({
    buffer: pdf,
    originalName: `${documentNumber}.pdf`,
    mimeType: "application/pdf",
    category: "generated",
  });

  const declarationDocument = await prisma.generatedDocument.create({
    data: {
      documentType: "INSTRUCTION_DECLARATION",
      documentNumber,
      payload: { instructionId: instruction.id, confirmedAt: confirmedAt.toISOString(), confirmedIp } as never,
      storageKey,
      createdById: userId,
    },
  });

  await prisma.instruction.update({
    where: { id },
    data: { confirmedAt, confirmedIp, declarationDocumentId: declarationDocument.id },
  });

  await recordAuditEntry({
    actorId: userId,
    actorRole: role,
    action: "osh.instruction.confirm",
    resource: "Instruction",
    resourceId: id,
    ipAddress: confirmedIp,
  });

  return NextResponse.redirect(new URL(`/osh/${id}`, request.url), { status: 303 });
}
