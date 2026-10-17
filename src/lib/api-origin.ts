const PRODUCTION_API_ORIGIN = "https://api.ybaha.com";
const DEVELOPMENT_API_ORIGIN = "http://localhost:8787";

function parsePublicApiUrl(raw: string): string {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new Error("NEXT_PUBLIC_API_URL is not a valid URL.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("NEXT_PUBLIC_API_URL must use http or https.");
  }
  if (
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      "NEXT_PUBLIC_API_URL must be an origin only (no credentials, path, query, or hash).",
    );
  }
  return url.origin;
}

/** Resolves the standalone API origin from public env (build-time safe; no window access). */
export function resolveApiOrigin(): string {
  const explicit = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (explicit) {
    return parsePublicApiUrl(explicit);
  }
  if (process.env.NODE_ENV === "production") {
    return PRODUCTION_API_ORIGIN;
  }
  return DEVELOPMENT_API_ORIGIN;
}
