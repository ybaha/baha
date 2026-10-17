import { isIP } from "node:net";

export type TrustedIpOptions = {
  trustProxy: boolean;
  trustedProxyPeers: ReadonlySet<string>;
};

function normalizePeerAddress(address: string | undefined): string | null {
  if (!address) return null;
  if (address.startsWith("::ffff:")) {
    const mapped = address.slice("::ffff:".length);
    if (isIP(mapped) === 4) return mapped;
  }
  return isIP(address) ? address : null;
}

// Only this server's verified peer/proxy resolution may supply SDK client IPs.
export function authRequestHeaders(headers: Headers, clientIp: string): Headers {
  const sanitized = new Headers(headers);
  for (const name of ["x-forwarded-for", "cf-connecting-ip", "x-real-ip", "forwarded"]) {
    sanitized.delete(name);
  }
  if (isIP(clientIp)) sanitized.set("x-forwarded-for", clientIp);
  return sanitized;
}

function firstValidIp(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const first = raw.split(",")[0]?.trim();
  if (!first || isIP(first) === 0) return null;
  return first;
}

export function trustedClientIp(
  request: Request,
  socketPeerAddress: string | undefined,
  options: TrustedIpOptions,
): string {
  const peer = normalizePeerAddress(socketPeerAddress);
  if (!peer) {
    return "unavailable";
  }

  if (
    options.trustProxy &&
    options.trustedProxyPeers.size > 0 &&
    options.trustedProxyPeers.has(peer)
  ) {
    const forwarded =
      firstValidIp(request.headers.get("cf-connecting-ip")) ??
      firstValidIp(request.headers.get("x-forwarded-for"));
    if (forwarded) {
      return forwarded;
    }
  }

  return peer;
}
