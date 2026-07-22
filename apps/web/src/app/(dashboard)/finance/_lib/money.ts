/** Parses a decimal string like "123.45" (as typed into a form) into integer minor units. */
export function parseMinorAmount(input: string): number {
  const value = Number.parseFloat(input);
  if (Number.isNaN(value)) {
    throw new Error(`Invalid amount: ${input}`);
  }
  return Math.round(value * 100);
}

// formatMinorAmount lives in @codea-srm/core (packages/core/src/documents/shared.ts) — import from there, not a local copy.
