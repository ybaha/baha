import { RPCHandler } from "@orpc/server/fetch";
import { ORPCError } from "@orpc/server";
import {
  RequestHeadersPlugin,
  ResponseHeadersPlugin,
  SimpleCsrfProtectionHandlerPlugin,
  StrictGetMethodPlugin,
} from "@orpc/server/plugins";
import { getConnInfo } from "@hono/node-server/conninfo";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { bodyLimit } from "hono/body-limit";
import type { Context } from "hono";

import type { DatabaseBundle } from "./db/client.js";
import type { ServerEnv } from "./env.js";
import { authRequestHeaders, trustedClientIp } from "./lib/client-ip.js";
import { createApiError } from "./lib/api-error.js";
import {
  isAllowedReadOrigin,
  isAllowedWriteOrigin,
  isPreviewReadOrigin,
} from "./lib/origins.js";
import { orpcErrorResponse } from "./lib/orpc-boundary.js";
import { MemoryRateLimiter } from "./lib/rate-limit.js";
import { loadSlugManifest } from "./lib/slug-manifest.js";
import { createMemoizedSessionResolver } from "./lib/session-resolver.js";
import type { AppServices, RpcContext, SessionResolver } from "./rpc/context.js";
import { buildRouter } from "./rpc/router.js";
import { createViewsCache } from "./services/views.js";
import { createVisitDedupeStore, createVisitEventStore } from "./services/visits.js";
import { createVisitCipher } from "./services/visit-crypto.js";
import { createVisitRecorder, type VisitRecorder } from "./services/visit-records.js";

export const RPC_PREFIX = "/rpc";

function isReadOnlyRpcPath(pathname: string): boolean {
  const canonicalPath = pathname.replace(/\/+$/, "");
  return canonicalPath === "/rpc/comments/list" || canonicalPath === "/rpc/views/get"
    || canonicalPath === "/rpc/visits/publicKey";
}
export const CSRF_HEADER_NAME = "x-csrf-token";
export const CSRF_HEADER_VALUE = "orpc";

export type CreateAppOptions = {
  env: ServerEnv;
  database: DatabaseBundle;
  getSession: SessionResolver;
  authHandler?: (request: Request) => Response | Promise<Response>;
  slugManifestPath?: string;
  services?: Partial<AppServices>;
  telegramTransport?: typeof fetch;
  visitRecorder?: VisitRecorder;
  rateLimiter?: MemoryRateLimiter;
  resolveSocketPeer?: (c: Context) => string | undefined;
};

function defaultSocketPeer(c: Context): string | undefined {
  try {
    return getConnInfo(c).remote.address;
  } catch {
    return undefined;
  }
}

export function createApp(options: CreateAppOptions) {
  const knownSlugs = loadSlugManifest(options.slugManifestPath);
  const services: AppServices = {
    knownSlugs,
    viewsCache: options.services?.viewsCache ?? createViewsCache(),
    visitDedupe: options.services?.visitDedupe ?? createVisitDedupeStore(),
    visitEvents: options.services?.visitEvents ?? createVisitEventStore(),
  };

  const router = buildRouter({
    db: options.database.db,
    env: options.env,
    services,
    telegramTransport: options.telegramTransport ?? fetch,
    visitCipher: options.env.visitEncryptionSecret
      ? createVisitCipher(options.env.visitEncryptionSecret) : undefined,
    visitRecorder: options.visitRecorder ?? createVisitRecorder(options.database.db),
  });

  const rpcHandler = new RPCHandler(router, {
    clientInterceptors: [async ({ next }) => {
      try {
        return await next();
      } catch (error) {
        if (error instanceof ORPCError) {
          if (error.code === "BAD_REQUEST") {
            throw createApiError("VALIDATION", "Invalid request input.");
          }
          throw error;
        }
        console.error("RPC service unavailable");
        throw createApiError("UNAVAILABLE");
      }
    }],
    plugins: [
      new RequestHeadersPlugin<RpcContext>(),
      new ResponseHeadersPlugin<RpcContext>(),
      new StrictGetMethodPlugin<RpcContext>(),
      new SimpleCsrfProtectionHandlerPlugin<RpcContext>({
        headerName: CSRF_HEADER_NAME,
        headerValue: CSRF_HEADER_VALUE,
        error: createApiError("FORBIDDEN", "Invalid CSRF header."),
      }),
    ],
  });

  const rateLimiter =
    options.rateLimiter ?? new MemoryRateLimiter(120, 60_000);
  const resolveSocketPeer = options.resolveSocketPeer ?? defaultSocketPeer;

  const app = new Hono();

  app.use("*", async (c, next) => {
    c.header("Cache-Control", "no-store");
    await next();
  });

  app.use(
    "*",
    cors({
      origin: (origin) => {
        if (!origin) return null;
        if (isAllowedReadOrigin(options.env, origin)) return origin;
        return null;
      },
      credentials: true,
      allowHeaders: [
        "Content-Type",
        "Authorization",
        "Cookie",
        CSRF_HEADER_NAME,
      ],
      exposeHeaders: ["Set-Cookie"],
    }),
  );

  const authHandler = options.authHandler;
  if (authHandler) {
    app.use("/auth/*", bodyLimit({ maxSize: options.env.bodyLimitBytes }));
    app.all("/auth/*", async (c) => {
      const origin = c.req.header("origin") ?? null;
      // Even read-only previews must not read private session/email data.
      if (origin && !isAllowedWriteOrigin(options.env, origin)) {
        return c.json({ code: "FORBIDDEN", message: "Origin is not allowed." }, 403);
      }
      const clientIp = trustedClientIp(c.req.raw, resolveSocketPeer(c), {
        trustProxy: options.env.trustProxy,
        trustedProxyPeers: options.env.trustedProxyPeers,
      });
      const request = new Request(c.req.raw, {
        headers: authRequestHeaders(c.req.raw.headers, clientIp),
      });
      const response = await authHandler(request);
      const headers = new Headers(response.headers);
      headers.set("Cache-Control", "no-store");
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    });
  }

  app.get("/healthz", (c) => c.json({
    ok: true,
    visits: {
      telegramConfigured: Boolean(options.env.telegramBotToken?.trim()),
      encryptionConfigured: Boolean(options.env.visitEncryptionSecret),
      production: options.env.nodeEnv === "production",
    },
  }));
  app.get("/readyz", async (c) => {
    const ok = await options.database.ping().catch(() => false);
    return c.json({ ok, db: ok }, ok ? 200 : 503);
  });

  app.post("/api/send-location", (c) => c.json({ error: "Gone" }, 410));

  const limitBody = bodyLimit({
    maxSize: options.env.bodyLimitBytes,
    onError: () => orpcErrorResponse("PAYLOAD_TOO_LARGE", "Payload too large."),
  });
  const limitVisitBody = bodyLimit({
    maxSize: Math.min(8192, options.env.bodyLimitBytes),
    onError: () => orpcErrorResponse("PAYLOAD_TOO_LARGE", "Payload too large."),
  });
  const limitEncryptedVisitBody = bodyLimit({
    maxSize: Math.min(16384, options.env.bodyLimitBytes),
    onError: () => orpcErrorResponse("PAYLOAD_TOO_LARGE", "Payload too large."),
  });
  app.use(`${RPC_PREFIX}/*`, (c, next) => {
    const path = c.req.path.replace(/\/+$/, "");
    const limit = path === "/rpc/visits/notifyEncrypted" ? limitEncryptedVisitBody
      : path === "/rpc/visits/notify" ? limitVisitBody : limitBody;
    return limit(c, next);
  });

  app.all(`${RPC_PREFIX}/*`, async (c) => {
    const origin = c.req.header("origin") ?? null;
    const method = c.req.method;
    if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {
      const readOnly = isReadOnlyRpcPath(c.req.path);
      const allowed =
        isAllowedWriteOrigin(options.env, origin) ||
        (readOnly && isAllowedReadOrigin(options.env, origin));
      if (!allowed) {
        return orpcErrorResponse("FORBIDDEN", "Forbidden origin.");
      }
    }

    const trustedIp = trustedClientIp(c.req.raw, resolveSocketPeer(c), {
      trustProxy: options.env.trustProxy,
      trustedProxyPeers: options.env.trustedProxyPeers,
    });
    const limitKey = `ip:${trustedIp}`;
    const limited = rateLimiter.consume(limitKey);
    if (!limited.allowed) {
      const headers: Record<string, string> = {};
      if (limited.retryAfterSec) {
        headers["retry-after"] = String(limited.retryAfterSec);
      }
      return orpcErrorResponse("RATE_LIMITED", "Rate limited.", { headers });
    }

    const preview = isPreviewReadOrigin(options.env, origin);
    const context: RpcContext = {
      headers: authRequestHeaders(c.req.raw.headers, trustedIp),
      resHeaders: new Headers(),
      user: null,
      trustedIp,
      isPreviewOrigin: preview,
      getSession: createMemoizedSessionResolver(preview ? async () => null : options.getSession),
    };

    const { matched, response } = await rpcHandler.handle(c.req.raw, {
      prefix: RPC_PREFIX,
      context,
    });

    if (!matched) {
      return orpcErrorResponse("NOT_FOUND", "Not found.");
    }

    response.headers.set("Cache-Control", "no-store");
    return response;
  });

  return { app, services };
}
