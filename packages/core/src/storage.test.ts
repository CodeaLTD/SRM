import { describe, expect, it } from "vitest";
import { FileTooLargeError, MAX_STORED_FILE_SIZE_BYTES, saveFile } from "./storage";

describe("saveFile", () => {
  it("rejects a buffer over the storage ceiling before touching disk", async () => {
    const oversized = Buffer.alloc(MAX_STORED_FILE_SIZE_BYTES + 1);
    await expect(
      saveFile({ buffer: oversized, originalName: "big.pdf", mimeType: "application/pdf", category: "uploads" }),
    ).rejects.toThrow(FileTooLargeError);
  });
});
