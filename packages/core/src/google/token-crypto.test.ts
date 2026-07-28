import { randomBytes } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { decryptToken, encryptToken } from "./token-crypto";

beforeAll(() => {
  process.env.GOOGLE_TOKEN_ENCRYPTION_KEY = randomBytes(32).toString("base64");
});

describe("encryptToken / decryptToken", () => {
  it("round-trips a token", () => {
    const blob = encryptToken("1//0some-refresh-token");
    expect(blob).not.toContain("1//0some-refresh-token");
    expect(decryptToken(blob)).toBe("1//0some-refresh-token");
  });

  it("produces a different ciphertext each call (random IV)", () => {
    const first = encryptToken("same-plaintext");
    const second = encryptToken("same-plaintext");
    expect(first).not.toBe(second);
  });

  it("throws instead of returning garbage when the ciphertext is tampered with", () => {
    const blob = encryptToken("1//0some-refresh-token");
    const [iv, authTag, ciphertext] = blob.split(":") as [string, string, string];
    const tampered = Buffer.from(ciphertext, "base64");
    tampered[0] = (tampered[0] ?? 0) ^ 0xff;
    const tamperedBlob = [iv, authTag, tampered.toString("base64")].join(":");
    expect(() => decryptToken(tamperedBlob)).toThrow();
  });

  it("throws on a malformed blob", () => {
    expect(() => decryptToken("not-a-valid-blob")).toThrow();
  });
});
