import Link from "next/link";
import { auth } from "@/auth";
import { assertCanAny, can, canAny } from "@codea-srm/core";
import { prisma } from "@codea-srm/db";

// Epic OSH — compliance-critical (PRD §8 Module 5). Admin manages the
// register (osh:register:manage), Analyst is awareness-only
// (osh:register:read), User sees only their own instructions
// (osh:instruction:confirm:own), Sales has no access (blocked at
// middleware.ts before this page runs).
export default async function OshPage() {
  const session = await auth();
  const role = session!.user.role;
  const userId = session!.user.id;

  assertCanAny(role, ["osh:register:manage", "osh:register:read", "osh:instruction:confirm:own"]);

  const canManage = can(role, "osh:register:manage");
  // Both osh:register:manage (Admin) and osh:register:read (Analyst,
  // awareness-only) see the whole register; scopeToOwnerUnless only checks
  // a single capability, so a plain USER (neither of those) is the only
  // role scoped down to their own instructions.
  const canViewAll = canAny(role, ["osh:register:manage", "osh:register:read"]);
  const ownerId = canViewAll ? undefined : userId;

  const instructions = await prisma.instruction.findMany({
    where: ownerId ? { employeeId: ownerId } : undefined,
    include: { employee: true, instructor: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <section>
      <h1>Health &amp; Safety (ЗБУТ)</h1>
      {canManage && (
        <nav>
          <Link href="/osh/new">New instruction</Link>
        </nav>
      )}
      <table>
        <thead>
          <tr>
            <th>Employee</th>
            <th>Type</th>
            <th>Conducted</th>
            <th>Next due</th>
            <th>Confirmed</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {instructions.map((instruction) => (
            <tr key={instruction.id}>
              <td>{instruction.employee.name ?? instruction.employee.email}</td>
              <td>{instruction.type}</td>
              <td>{instruction.conductedAt.toDateString()}</td>
              <td>{instruction.nextPeriodicDueAt ? instruction.nextPeriodicDueAt.toDateString() : "—"}</td>
              <td>{instruction.confirmedAt ? instruction.confirmedAt.toDateString() : "Pending"}</td>
              <td>
                <Link href={`/osh/${instruction.id}`}>View</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
