import { isIP } from "node:net";

export class ConfigurationError extends Error {}

export type ServerEnv = {
  nodeEnv: string;
  host: string;
  port: number;
  databaseUrl: string;
  readOrigins: Set<string>;
  writeOrigins: Set<string>;
  previewReadOrigins: Set<string>;
  trustProxy: boolean;
  trustedProxyPeers: Set<string>;
  bodyLimitBytes: number;
  telegramBotToken?: string;
  telegramChatId?: string;
};

export type AuthConfig = {
  secret: string;
  baseUrl: string;
  githubClientId: string;
  githubClientSecret: string;
  googleClientId: string;
  googleClientSecret: string;
  trustedOrigins: string[];
  secureCookies: boolean;
};

const MIN_AUTH_SECRET_LENGTH = 32;

function parseList(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function normalizeOrigin(origin: string, label: string): string {
  if (origin.includes("*")) {
    throw new Error(`${label}: wildcards are not allowed`);
  }
  let url: URL;
  try {
    url = new URL(origin);
  } catch {
    throw new Error(`${label}: invalid origin URL`);
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`${label}: unsupported origin protocol`);
  }
  if (url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new Error(`${label}: origin must not include credentials, path, query, or hash`);
  }
  return url.origin;
}

function parseOriginList(
  raw: string | undefined,
  label: string,
): Set<string> {
  const out = new Set<string>();
  for (const part of parseList(raw)) {
    out.add(normalizeOrigin(part, label));
  }
  return out;
}

function parseCanonicalBaseUrl(raw: string | undefined): string {
  if (!raw?.trim()) {
    throw new Error("API_BASE_URL is required");
  }
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new Error("API_BASE_URL is invalid");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("API_BASE_URL must use http or https");
  }
  if (url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new Error("API_BASE_URL must not include credentials, path, query, or hash");
  }
  return url.origin;
}

function assertWriteOriginsSubset(
  readOrigins: Set<string>,
  writeOrigins: Set<string>,
): void {
  for (const origin of writeOrigins) {
    if (!readOrigins.has(origin)) {
      throw new Error(
        "API_WRITE_ORIGINS must be a subset of API_READ_ORIGINS",
      );
    }
  }
}

export function parseServerEnv(
  env: NodeJS.ProcessEnv = process.env,
): ServerEnv {
  const nodeEnv = env.NODE_ENV ?? "development";
  const host = env.HOST?.trim() || "127.0.0.1";
  const port = Number(env.PORT?.trim() || "8787");
  const databaseUrl = env.DATABASE_URL ?? "";
  const readOrigins = parseOriginList(
    env.API_READ_ORIGINS ?? env.API_CORS_ORIGINS,
    "API_READ_ORIGINS",
  );
  const writeOrigins = parseOriginList(
    env.API_WRITE_ORIGINS ?? env.API_CORS_ORIGINS,
    "API_WRITE_ORIGINS",
  );
  const previewReadOrigins = parseOriginList(
    env.API_PREVIEW_READ_ORIGINS,
    "API_PREVIEW_READ_ORIGINS",
  );
  assertWriteOriginsSubset(readOrigins, writeOrigins);
  for (const origin of previewReadOrigins) {
    if (writeOrigins.has(origin)) throw new Error("Preview origins must be read-only");
  }
  const trustProxy = env.API_TRUST_PROXY === "1" || env.API_TRUST_PROXY === "true";
  const trustedProxyPeers = new Set(parseList(env.API_TRUSTED_PROXY_PEERS).map((address) => {
    if (!isIP(address)) throw new Error("API_TRUSTED_PROXY_PEERS must contain IP addresses");
    return address.startsWith("::ffff:") && isIP(address.slice(7)) === 4
      ? address.slice(7) : address;
  }));
  if (trustProxy && !trustedProxyPeers.size) {
    throw new Error("API_TRUST_PROXY requires explicit trusted peer IPs");
  }
  const bodyLimitBytes = Number(env.API_BODY_LIMIT_BYTES?.trim() || "65536");

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }
  if (!["development", "test", "production"].includes(nodeEnv)) {
    throw new Error("NODE_ENV must be development, test, or production");
  }
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error("PORT must be an integer between 0 and 65535");
  }
  if (!Number.isInteger(bodyLimitBytes) || bodyLimitBytes <= 0 || bodyLimitBytes > 16 * 1024 * 1024) {
    throw new Error("API_BODY_LIMIT_BYTES must be a positive integer no larger than 16MB");
  }

  return {
    nodeEnv,
    host,
    port,
    databaseUrl,
    readOrigins,
    writeOrigins,
    previewReadOrigins,
    trustProxy,
    trustedProxyPeers,
    bodyLimitBytes,
    telegramBotToken: env.TELEGRAM_BOT_TOKEN,
    telegramChatId: env.TELEGRAM_CHAT_ID,
  };
}

export function parseAuthConfig(
  env: NodeJS.ProcessEnv,
  serverEnv: ServerEnv,
): AuthConfig {
  const secret = env.API_AUTH_SECRET?.trim() ?? "";
  if (!secret) {
    throw new Error("API_AUTH_SECRET is required");
  }
  if (secret.length < MIN_AUTH_SECRET_LENGTH) {
    throw new Error("API_AUTH_SECRET is too short");
  }

  const baseUrl = parseCanonicalBaseUrl(env.API_BASE_URL);
  if (serverEnv.nodeEnv === "production" && !baseUrl.startsWith("https://")) {
    throw new Error("Production API_BASE_URL must use HTTPS");
  }
  const githubClientId = env.GITHUB_CLIENT_ID?.trim() ?? "";
  const githubClientSecret = env.GITHUB_CLIENT_SECRET?.trim() ?? "";
  const googleClientId = env.GOOGLE_CLIENT_ID?.trim() ?? "";
  const googleClientSecret = env.GOOGLE_CLIENT_SECRET?.trim() ?? "";

  if (!githubClientId || !githubClientSecret) {
    throw new Error("GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET are required");
  }
  if (!googleClientId || !googleClientSecret) {
    throw new Error("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required");
  }

  if (serverEnv.writeOrigins.size === 0) {
    throw new Error("API_WRITE_ORIGINS is required for auth");
  }

  const trustedOrigins = [...serverEnv.writeOrigins];
  const secureCookies =
    serverEnv.nodeEnv === "production" || baseUrl.startsWith("https://");

  return {
    secret,
    baseUrl,
    githubClientId,
    githubClientSecret,
    googleClientId,
    googleClientSecret,
    trustedOrigins,
    secureCookies,
  };
}

export function validateServerStartup(env: NodeJS.ProcessEnv = process.env): {
  serverEnv: ServerEnv;
  authConfig: AuthConfig;
} {
  try {
    const serverEnv = parseServerEnv(env);
    const authConfig = parseAuthConfig(env, serverEnv);
    return { serverEnv, authConfig };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid server configuration";
    throw new ConfigurationError(message);
  }
}
