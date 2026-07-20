import { auth } from "@/auth";

// Epic OSH — compliance-critical (PRD §8 Module 5). Admin manages the
// register (osh:register:manage); employees only confirm their own
// instruction (osh:instruction:confirm:own) — both checked per-action
// once the Instruction model exists, not gated at this page level.
export default async function OshPage() {
  await auth();

  return (
    <section>
      <h1>Health &amp; Safety (ЗБУТ)</h1>
      <p>Instruction register (OSH-1..6) — not yet implemented.</p>
    </section>
  );
}
