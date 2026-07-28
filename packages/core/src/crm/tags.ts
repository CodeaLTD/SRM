/**
 * Parses a comma-separated "strategic importance" tag input (CRM-3) into a
 * clean array — trimmed, empty entries dropped, duplicates removed
 * case-insensitively (first-seen casing wins, so "Vendor" then "vendor"
 * keeps "Vendor") so near-duplicate tags don't fragment the filter list.
 *
 * Tags cannot themselves contain a comma — there is no escape syntax, so a
 * comma always ends the current tag. The form labels this input
 * explicitly as comma-separated for that reason.
 */
export function parseTags(raw: string): string[] {
  const seen = new Map<string, string>();
  for (const part of raw.split(",")) {
    const tag = part.trim();
    if (!tag) continue;
    const key = tag.toLowerCase();
    if (!seen.has(key)) seen.set(key, tag);
  }
  return [...seen.values()];
}
