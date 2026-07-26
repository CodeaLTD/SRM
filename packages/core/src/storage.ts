import { randomUUID } from "node:crypto";
import { mkdir, readFile as fsReadFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Local-disk file storage for finance uploads/generated PDFs (FIN-1/4).
 * No object storage (S3/MinIO) exists anywhere in this repo yet, and the
 * project otherwise runs entirely on self-hosted Postgres + Redis with no
 * external cloud deps — a Docker volume mounted at FILE_STORAGE_ROOT
 * matches that pattern. `storageKey` is treated as opaque by every caller,
 * so swapping this module for an S3-backed one later is an internal
 * change only.
 */

export type StorageCategory = "uploads" | "generated";

function storageRoot(): string {
  return process.env.FILE_STORAGE_ROOT ?? path.join(process.cwd(), ".data", "storage");
}

/** Rejects any key that could escape the storage root (e.g. via `..`). */
function assertSafeKey(storageKey: string): void {
  const resolved = path.resolve(storageRoot(), storageKey);
  if (!resolved.startsWith(path.resolve(storageRoot()) + path.sep)) {
    throw new Error(`Unsafe storage key: ${storageKey}`);
  }
}

export interface SaveFileInput {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  category: StorageCategory;
}

export interface SaveFileResult {
  storageKey: string;
  sizeBytes: number;
}

/** Writes a file under `<category>/<year>/<month>/<uuid><ext>` and returns the relative key to persist in the DB. */
export async function saveFile({ buffer, originalName, category }: SaveFileInput): Promise<SaveFileResult> {
  const now = new Date();
  const dir = path.join(category, String(now.getUTCFullYear()), String(now.getUTCMonth() + 1).padStart(2, "0"));
  const ext = path.extname(originalName);
  const storageKey = path.join(dir, `${randomUUID()}${ext}`);

  assertSafeKey(storageKey);
  const absoluteDir = path.join(storageRoot(), dir);
  await mkdir(absoluteDir, { recursive: true });
  await writeFile(path.join(storageRoot(), storageKey), buffer);

  return { storageKey, sizeBytes: buffer.length };
}

/**
 * Strips characters that could break out of a quoted `Content-Disposition`
 * filename value (a `"` ends the quoted string early; CR/LF could inject
 * additional header content). Filenames served in HTTP responses come from
 * user input (`originalName`) — never interpolate them into a header
 * unsanitized.
 */
export function sanitizeFilenameForHeader(name: string): string {
  return name.replace(/["\r\n]/g, "_");
}

export function getFilePath(storageKey: string): string {
  assertSafeKey(storageKey);
  return path.join(storageRoot(), storageKey);
}

export async function readFile(storageKey: string): Promise<Buffer> {
  return fsReadFile(getFilePath(storageKey));
}

/** Only safe to call for files that were never attached to a confirmed record — confirmed records must persist for audit purposes. */
export async function deleteFile(storageKey: string): Promise<void> {
  await rm(getFilePath(storageKey), { force: true });
}
