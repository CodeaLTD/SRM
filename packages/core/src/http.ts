/**
 * Best-effort client IP resolution for audit-log/compliance purposes
 * (NFR-AUDIT, OSH-6). `X-Forwarded-For` is a comma-separated hop chain
 * where each proxy *appends* the address it saw to the end — the first
 * entry is whatever the original client sent and is fully attacker
 * controlled (any HTTP client can set arbitrary headers), so reading it
 * lets a caller forge the IP that lands in a legally significant
 * declaration PDF. The last entry is the address our own (assumed single)
 * reverse proxy observed making the connection, which the client cannot
 * override. This assumes exactly one trusted proxy hop in front of the
 * app; if the deployment topology changes (e.g. multiple chained
 * proxies/CDN), this needs to strip a known number of trusted hops from
 * the end instead of just taking the last one.
 */
export function resolveClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const hops = forwardedFor.split(",").map((hop) => hop.trim());
    const closestHop = hops[hops.length - 1];
    if (closestHop) return closestHop;
  }
  return "unknown";
}
