const CANONICAL_SITE =
  (process.env.NEXT_PUBLIC_SITE_URL ?? "https://ybaha.com").replace(
    /\/+$/,
    "",
  );

function canonicalHostname(): string {
  try {
    return new URL(CANONICAL_SITE).hostname;
  } catch {
    return "ybaha.com";
  }
}

/** Cloudflare Pages previews and explicit auth-disabled builds stay public/read-only. */
export function isAuthDisabledClient(): boolean {
  if (process.env.NEXT_PUBLIC_DISABLE_AUTH === "true") {
    return true;
  }
  if (typeof window === "undefined") {
    return false;
  }
  const host = window.location.hostname;
  return host.endsWith(".pages.dev");
}

/** Pure policy for visit notifications (preview/local/auth-disabled always off). */
export function visitNotificationsAllowed(
  hostname: string,
  authDisabled: boolean,
  envOverride: boolean,
  canonicalHost = "ybaha.com",
): boolean {
  if (authDisabled || hostname.endsWith(".pages.dev")) {
    return false;
  }
  if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname === "127.0.0.1" || hostname === "[::1]" || hostname === "::1") {
    return false;
  }
  if (envOverride) {
    return true;
  }
  return hostname === canonicalHost;
}

export function isVisitNotificationsEnabled(): boolean {
  if (typeof window === "undefined" || process.env.NODE_ENV !== "production") {
    return false;
  }
  return visitNotificationsAllowed(
    window.location.hostname,
    isAuthDisabledClient(),
    process.env.NEXT_PUBLIC_ENABLE_VISIT_NOTIFICATIONS === "true",
    canonicalHostname(),
  );
}
