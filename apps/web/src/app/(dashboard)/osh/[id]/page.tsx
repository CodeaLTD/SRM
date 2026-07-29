import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { assertCanAny, can, canAny } from "@codea-srm/core";
import { prisma } from "@codea-srm/db";

export default async function InstructionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const role = session!.user.role;
  const userId = session!.user.id;

  assertCanAny(role, ["osh:register:manage", "osh:register:read", "osh:instruction:confirm:own"]);

  const instruction = await prisma.instruction.findUnique({
    where: { id },
    include: { employee: true, instructor: true, declarationDocument: true },
  });
  if (!instruction) notFound();

  const canManage = can(role, "osh:register:manage");
  const canViewAll = canAny(role, ["osh:register:manage", "osh:register:read"]);
  const isOwnInstruction = instruction.employeeId === userId;
  if (!canViewAll && !isOwnInstruction) {
    // Row-level scoping (NFR-AUTHZ): a User with only the "own" capability
    // must not be able to view someone else's instruction by guessing an id.
    notFound();
  }

  const canConfirm = (canManage || isOwnInstruction) && can(role, "osh:instruction:confirm:own") && !instruction.confirmedAt;

  return (
    <section>
      <h1>Instruction</h1>
      <dl>
        <dt>Employee</dt>
        <dd>{instruction.employee.name ?? instruction.employee.email}</dd>
        <dt>Type</dt>
        <dd>{instruction.type}</dd>
        <dt>Instructor</dt>
        <dd>{instruction.instructor.name ?? instruction.instructor.email}</dd>
        <dt>Conducted on</dt>
        <dd>{instruction.conductedAt.toDateString()}</dd>
        <dt>Next periodic due</dt>
        <dd>{instruction.nextPeriodicDueAt ? instruction.nextPeriodicDueAt.toDateString() : "—"}</dd>
        <dt>Confirmed</dt>
        <dd>
          {instruction.confirmedAt
            ? `${instruction.confirmedAt.toDateString()} (IP ${instruction.confirmedIp})`
            : "Pending"}
        </dd>
      </dl>

      {canManage && !instruction.confirmedAt && <p><Link href={`/osh/${instruction.id}/edit`}>Edit</Link></p>}

      {canConfirm && (
        <form action={`/api/osh/instructions/${instruction.id}/confirm`} method="post">
          <button type="submit">Confirm instruction</button>
        </form>
      )}

      {instruction.declarationDocument && (
        <p>
          <Link href={`/api/osh/documents/${instruction.declarationDocument.id}/download`}>
            Download declaration ({instruction.declarationDocument.documentNumber})
          </Link>
        </p>
      )}
    </section>
  );
}
