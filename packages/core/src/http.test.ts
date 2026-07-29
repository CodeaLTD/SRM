import { describe, expect, it } from "vitest";
import { resolveClientIp } from "./http";

function requestWithForwardedFor(value: string | undefined): Request {
  const headers = new Headers();
  if (value !== undefined) headers.set("x-forwarded-for", value);
  return new Request("http://localhost/", { headers });
}

describe("resolveClientIp", () => {
  it("takes the last hop, not the client-supplied first hop", () => {
    // A client can freely set the first entry; only the last entry was
    // appended by our own reverse proxy and reflects the real connection.
    expect(resolveClientIp(requestWithForwardedFor("9.9.9.9 (forged), 203.0.113.5"))).toBe("203.0.113.5");
  });

  it("returns the single hop when there's only one", () => {
    expect(resolveClientIp(requestWithForwardedFor("203.0.113.5"))).toBe("203.0.113.5");
  });

  it("falls back to 'unknown' when the header is missing", () => {
    expect(resolveClientIp(requestWithForwardedFor(undefined))).toBe("unknown");
  });
});
