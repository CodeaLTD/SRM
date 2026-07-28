/**
 * Parses a comma-separated "strategic importance" tag input (CRM-3) into a
 * clean array — trimmed, empty entries dropped, duplicates removed. Kept
 * as a pure, testable helper rather than inlined in the server action.
 */
export function parseTags(raw: string): string[] {
  const seen = new Set<string>();
  for (const part of raw.split(",")) {
    const tag = part.trim();
    if (tag) seen.add(tag);
  }
  return [...seen];
}
