import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { after, before, describe, it } from "node:test";

import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { StandardRPCJsonSerializer, StandardRPCSerializer } from "@orpc/client/standard";
import { SimpleCsrfProtectionLinkPlugin } from "@orpc/client/plugins";
import { ORPCError } from "@orpc/client";
import { getCookies } from "better-auth/cookies";
import { serializeSignedCookie } from "better-call";
import pgDriver from "pg";

import { createAuthRuntime } from "../../server/src/auth.ts";
import { CSRF_HEADER_NAME, CSRF_HEADER_VALUE, createApp } from "../../server/src/app.ts";
import { createDatabase } from "../../server/src/db/client.ts";
import { runMigrations } from "../../server/src/db/migrate.ts";
import { authSessions, users } from "../../server/src/db/schema.ts";
import { createId } from "../../server/src/lib/ids.ts";
import { parseAuthConfig, parseServerEnv, validateServerStartup } from "../../server/src/env.ts";
import { adoptDrizzleBaseline } from "../../server/scripts/schema-tools.mjs";
import { startLoopbackPostgres } from "./server-pg.mjs";

const repoRoot = join(fileURLToPath(new URL(".", import.meta.url)), "../..");
const slugManifestPath = join(repoRoot, "server/src/slug-manifest.json");
const manifest = JSON.parse(readFileSync(slugManifestPath, "utf8"));
const knownSlug = manifest.writingSlugs[0];

const AUTH_SECRET = "integration-test-auth-secret-32chars!!";
const WRITE_ORIGIN = "http://127.0.0.1:3100";
const legacyInitSql = readFileSync(
  join(repoRoot, "prisma/migrations/0_init/migration.sql"),
  "utf8",
);

let pg;
let database;
const listeners = new Set();
const rpcSerializer = new StandardRPCSerializer(new StandardRPCJsonSerializer());
const encodeInput = (input) => JSON.stringify(rpcSerializer.serialize(input));

function authEnv(overrides = {}) {
  return {
    API_BASE_URL: "http://127.0.0.1:8787",
    API_AUTH_SECRET: AUTH_SECRET,
    GITHUB_CLIENT_ID: "test-github-client-id",
    GITHUB_CLIENT_SECRET: "test-github-client-secret",
    GOOGLE_CLIENT_ID: "test-google-client-id",
    GOOGLE_CLIENT_SECRET: "test-google-client-secret",
    ...overrides,
  };
}

function makeServerEnv(databaseUrl, overrides = {}) {
  return parseServerEnv({
    NODE_ENV: "test",
    DATABASE_URL: databaseUrl,
    HOST: "127.0.0.1",
    PORT: "0",
    API_READ_ORIGINS: `${WRITE_ORIGIN},https://preview.pages.dev`,
    API_WRITE_ORIGINS: WRITE_ORIGIN,
    API_PREVIEW_READ_ORIGINS: "https://preview.pages.dev",
    API_BODY_LIMIT_BYTES: "65536",
    ...overrides,
  });
}

async function signSessionCookie(auth, sessionToken) {
  const cookies = getCookies(auth.options);
  const { name, attributes } = cookies.sessionToken;
  return serializeSignedCookie(name, sessionToken, auth.options.secret, {
    httpOnly: attributes.httpOnly,
    secure: attributes.secure,
    sameSite: attributes.sameSite,
    path: attributes.path,
  });
}

async function seedSession(auth, userId, options = {}) {
  const dbBundle = options.db ?? database;
  const token = createId();
  const now = new Date();
  await dbBundle.db.insert(authSessions).values({
    id: createId(),
    token,
    userId,
    expiresAt: options.expiresAt ?? new Date(Date.now() + 60 * 60 * 1000),
    createdAt: now,
    updatedAt: options.updatedAt ?? now,
  });
  const cookie = await signSessionCookie(auth, token);
  return { token, cookie };
}

async function startAuthServer(overrides = {}) {
  const dbBundle = overrides.database ?? database;
  const databaseUrl = overrides.databaseUrl ?? pg.databaseUrl;
  const env = makeServerEnv(databaseUrl, overrides.serverEnv);
  const authConfig = parseAuthConfig(authEnv(overrides.auth), env);
  const runtime = createAuthRuntime({ db: dbBundle.db, config: authConfig });
  const { app } = createApp({
    env,
    database: dbBundle,
    getSession: runtime.sessionResolver,
    authHandler: runtime.handler,
    slugManifestPath,
  });
  const { serve } = await import("@hono/node-server");
  return await new Promise((resolve) => {
    const listener = serve({ fetch: app.fetch, hostname: "127.0.0.1", port: 0 }, (info) => {
      resolve({
        baseUrl: `http://127.0.0.1:${info.port}`,
        auth: runtime.auth,
        runtime,
        env,
        authConfig,
        close: () =>
          new Promise((done) => {
            listener.close(() => {
              listeners.delete(listener);
              done();
            });
            listener.closeAllConnections();
          }),
      });
    });
    listeners.add(listener);
  });
}

function makeClient(baseUrl, { cookie, origin = WRITE_ORIGIN } = {}) {
  const link = new RPCLink({
    url: `${baseUrl}/rpc`,
    fetch: (request, init) =>
      fetch(request, {
        ...init,
        headers: {
          ...Object.fromEntries(new Headers(init?.headers ?? {})),
          origin,
          ...(cookie ? { cookie } : {}),
          [CSRF_HEADER_NAME]: CSRF_HEADER_VALUE,
        },
      }),
    plugins: [new SimpleCsrfProtectionLinkPlugin()],
  });
  return createORPCClient(link);
}

async function applyLegacySchema(databaseUrl) {
  const pool = new pgDriver.Pool({ connectionString: databaseUrl });
  try {
    await pool.query(legacyInitSql);
  } finally {
    await pool.end();
  }
}

before(async () => {
  pg = await startLoopbackPostgres();
  database = createDatabase({ connectionString: pg.databaseUrl });
  await runMigrations(database.db, pg.databaseUrl);
});

after(async () => {
  try {
    await Promise.all(
      [...listeners].map(
        (listener) =>
          new Promise((done) => {
            listener.close(done);
            listener.closeAllConnections();
          }),
      ),
    );
  } finally {
    try {
      await database?.shutdown();
    } finally {
      await pg?.stop();
    }
  }
});

describe("Better Auth runtime", { timeout: 60_000 }, () => {
  it("resolves sessions via the SDK for valid cookies", async (t) => {
    const server = await startAuthServer();
    t.after(server.close);
    const userId = createId();
    await database.db.insert(users).values({
      id: userId,
      email: `valid-${Date.now()}@example.com`,
      name: "Valid User",
    });
    const { cookie } = await seedSession(server.auth, userId);
    const session = await server.auth.api.getSession({
      headers: new Headers({ cookie }),
      returnHeaders: true,
    });
    assert.equal(session.response?.user.id, userId);
  });

  it("returns anonymous RPC access without a session cookie", async (t) => {
    const server = await startAuthServer();
    t.after(server.close);
    const client = makeClient(server.baseUrl);
    const result = await client.comments.list({ postSlug: knownSlug, limit: 5 });
    assert.ok(Array.isArray(result.comments));
  });

  it("rejects expired and tampered session cookies", async (t) => {
    const server = await startAuthServer();
    t.after(server.close);
    const userId = createId();
    await database.db.insert(users).values({
      id: userId,
      email: `expired-${Date.now()}@example.com`,
      name: "Expired User",
    });
    const expired = await seedSession(server.auth, userId, {
      expiresAt: new Date(Date.now() - 60_000),
    });
    const expiredSession = await server.auth.api.getSession({
      headers: new Headers({ cookie: expired.cookie }),
    });
    assert.equal(expiredSession, null);

    const cookies = getCookies(server.auth.options);
    const tampered = await serializeSignedCookie(
      cookies.sessionToken.name,
      "tampered-token",
      "wrong-secret-wrong-secret-wrong-secret!!",
    );
    const tamperedSession = await server.auth.api.getSession({
      headers: new Headers({ cookie: tampered }),
    });
    assert.equal(tamperedSession, null);
  });

  it("signs out and revokes the database session", async (t) => {
    const server = await startAuthServer();
    t.after(server.close);
    const userId = createId();
    await database.db.insert(users).values({
      id: userId,
      email: `signout-${Date.now()}@example.com`,
      name: "Signout User",
    });
    const { cookie, token } = await seedSession(server.auth, userId);
    const signOut = await fetch(`${server.baseUrl}/auth/sign-out`, {
      method: "POST",
      headers: {
        cookie,
        origin: WRITE_ORIGIN,
        "content-type": "application/json",
      },
      body: "{}",
    });
    assert.equal(signOut.status, 200);
    const rows = await database.db.select().from(authSessions);
    assert.equal(rows.some((row) => row.token === token), false);
    const session = await server.auth.api.getSession({
      headers: new Headers({ cookie }),
    });
    assert.equal(session, null);
  });

  it("uses host-only HttpOnly SameSite=Lax cookies and Secure in production config", async () => {
    const env = makeServerEnv(pg.databaseUrl, { NODE_ENV: "production" });
    const authConfig = parseAuthConfig(
      authEnv({ API_BASE_URL: "https://api.example.com" }),
      env,
    );
    assert.equal(authConfig.secureCookies, true);
    const runtime = createAuthRuntime({ db: database.db, config: authConfig });
    const cookies = getCookies(runtime.auth.options);
    assert.equal(cookies.sessionToken.attributes.httpOnly, true);
    assert.equal(cookies.sessionToken.attributes.sameSite, "lax");
    assert.equal(cookies.sessionToken.attributes.secure, true);
    assert.equal(cookies.sessionToken.attributes.domain, undefined);
  });

  it("denies untrusted callback URLs for auth flows", async (t) => {
    const server = await startAuthServer();
    t.after(server.close);
    const request = (callbackURL) => fetch(`${server.baseUrl}/auth/sign-in/social`, {
      method: "POST",
      headers: { origin: WRITE_ORIGIN, "content-type": "application/json" },
      body: JSON.stringify({ provider: "github", callbackURL }),
    });
    const valid = await request(`${WRITE_ORIGIN}/writings`);
    assert.equal(valid.status, 200);
    const authorization = new URL((await valid.json()).url);
    assert.equal(authorization.origin, "https://github.com");
    assert.equal(authorization.searchParams.get("redirect_uri"), "http://127.0.0.1:8787/auth/callback/github");
    const response = await request("https://evil.example/callback");
    assert.equal(response.status, 403);
  });

  it("propagates SDK Set-Cookie headers through oRPC responses", async (t) => {
    const server = await startAuthServer();
    t.after(server.close);
    const userId = createId();
    await database.db.insert(users).values({
      id: userId,
      email: `refresh-${Date.now()}@example.com`,
      name: "Refresh User",
    });
    const staleUpdatedAt = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const { cookie } = await seedSession(server.auth, userId, {
      updatedAt: staleUpdatedAt,
    });
    const response = await fetch(`${server.baseUrl}/rpc/comments/list`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: WRITE_ORIGIN,
        cookie,
        [CSRF_HEADER_NAME]: CSRF_HEADER_VALUE,
      },
      body: encodeInput({ postSlug: knownSlug, limit: 5 }),
    });
    assert.equal(response.status, 200);
    const setCookies =
      typeof response.headers.getSetCookie === "function"
        ? response.headers.getSetCookie()
        : [response.headers.get("set-cookie")].filter(Boolean);
    assert.ok(setCookies.length > 0);
  });

  it("keeps simultaneous users isolated across requests", async (t) => {
    const server = await startAuthServer();
    t.after(server.close);
    const aliceId = createId();
    const bobId = createId();
    await database.db.insert(users).values([
      {
        id: aliceId,
        email: `alice-${Date.now()}@example.com`,
        name: "Alice",
      },
      {
        id: bobId,
        email: `bob-${Date.now()}@example.com`,
        name: "Bob",
      },
    ]);
    const alice = await seedSession(server.auth, aliceId);
    const bob = await seedSession(server.auth, bobId);
    const [aliceSession, bobSession] = await Promise.all([
      server.auth.api.getSession({ headers: new Headers({ cookie: alice.cookie }) }),
      server.auth.api.getSession({ headers: new Headers({ cookie: bob.cookie }) }),
    ]);
    assert.equal(aliceSession?.user.id, aliceId);
    assert.equal(bobSession?.user.id, bobId);
    const [aliceComment, bobComment] = await Promise.all([
      makeClient(server.baseUrl, { cookie: alice.cookie }).comments.create({ postSlug: knownSlug, text: "Alice comment" }),
      makeClient(server.baseUrl, { cookie: bob.cookie }).comments.create({ postSlug: knownSlug, text: "Bob comment" }),
    ]);
    assert.equal(aliceComment.user.name, "Alice");
    assert.equal(bobComment.user.name, "Bob");
  });

  it("keeps credentialed previews anonymous and blocks all auth reads and writes", async (t) => {
    const server = await startAuthServer();
    t.after(server.close);
    const userId = createId();
    await database.db.insert(users).values({ id: userId, name: "Private User", email: `private-${Date.now()}@example.com` });
    const { cookie } = await seedSession(server.auth, userId);
    const signedIn = makeClient(server.baseUrl, { cookie });
    const comment = await signedIn.comments.create({ postSlug: knownSlug, text: "private vote" });
    await signedIn.votes.toggle({ commentId: comment.id, liked: true });
    const origin = "https://preview.pages.dev";
    const session = await fetch(`${server.baseUrl}/auth/get-session`, { headers: { cookie, origin } });
    assert.equal(session.status, 403);
    assert.equal(session.headers.getSetCookie().length, 0);
    const page = await makeClient(server.baseUrl, { cookie, origin }).comments.list({ postSlug: knownSlug, limit: 50 });
    assert.equal(page.comments.find((item) => item.id === comment.id)?.currentUserVote, 0);
    const signOut = await fetch(`${server.baseUrl}/auth/sign-out`, {
      method: "POST", headers: { cookie, origin, "content-type": "application/json" }, body: "{}",
    });
    assert.equal(signOut.status, 403);
    assert.ok(await server.auth.api.getSession({ headers: new Headers({ cookie }) }));
  });

  it("validates IPs, origins, credentials and production HTTPS without bypass flags", () => {
    const env = makeServerEnv(pg.databaseUrl, { API_TRUST_PROXY: "true", API_TRUSTED_PROXY_PEERS: "127.0.0.1,::1" });
    assert.deepEqual([...env.trustedProxyPeers], ["127.0.0.1", "::1"]);
    const blankDefaults = makeServerEnv(pg.databaseUrl, { HOST: "", PORT: "", API_BODY_LIMIT_BYTES: "" });
    assert.equal(blankDefaults.host, "127.0.0.1");
    assert.equal(blankDefaults.port, 8787);
    assert.equal(blankDefaults.bodyLimitBytes, 65536);
    for (const invalid of [
      { API_TRUSTED_PROXY_PEERS: "http://127.0.0.1" },
      { API_READ_ORIGINS: "https://user:password@app.example.com" },
      { API_WRITE_ORIGINS: "https://preview.pages.dev" },
      { PORT: "1.5" }, { PORT: "65536" }, { API_BODY_LIMIT_BYTES: "1.5" },
    ]) assert.throws(() => makeServerEnv(pg.databaseUrl, invalid));
    const production = makeServerEnv(pg.databaseUrl, { NODE_ENV: "production" });
    assert.throws(() => parseAuthConfig(authEnv(), production), /HTTPS/);
    assert.throws(() => parseAuthConfig(authEnv({ API_BASE_URL: "https://user:password@api.example.com" }), production), /credentials/);
    assert.throws(() => validateServerStartup({
      DATABASE_URL: pg.databaseUrl, NODE_ENV: "production", API_AUTH_CONFIGURED: "true",
    }), /API_AUTH_SECRET/);
  });

  it("maps DB failures to UNAVAILABLE for RPC session resolution", async (t) => {
    const fixture = await startLoopbackPostgres();
    const localDb = createDatabase({ connectionString: fixture.databaseUrl });
    await runMigrations(localDb.db, fixture.databaseUrl);
    const server = await startAuthServer({
      database: localDb,
      databaseUrl: fixture.databaseUrl,
    });
    t.after(async () => {
      await server.close();
      await fixture.stop();
    });
    const userId = createId();
    await localDb.db.insert(users).values({
      id: userId,
      email: `dbfail-${Date.now()}@example.com`,
      name: "DB Fail",
    });
    const { cookie } = await seedSession(server.auth, userId, { db: localDb });
    await localDb.pool.end();
    const client = makeClient(server.baseUrl, { cookie });
    await assert.rejects(
      () => client.comments.list({ postSlug: knownSlug, limit: 5 }),
      (error) => error instanceof ORPCError && error.code === "UNAVAILABLE",
    );
  });

  it("resolves backfilled legacy users through the SDK adapter", async (t) => {
    const fixture = await startLoopbackPostgres();
    const legacyDb = createDatabase({ connectionString: fixture.databaseUrl });
    try {
      await applyLegacySchema(fixture.databaseUrl);
      const pool = new pgDriver.Pool({ connectionString: fixture.databaseUrl });
      const userId = createId();
      const verifiedAt = new Date("2024-06-01T12:00:00.000Z");
      await pool.query(
        `INSERT INTO "User" (id, name, email, "emailVerified") VALUES ($1, $2, $3, $4)`,
        [userId, "Legacy User", `legacy-${Date.now()}@example.com`, verifiedAt],
      );
      await pool.query(
        `INSERT INTO "Account" (id, "userId", type, provider, "providerAccountId")
         VALUES ($1, $2, 'oauth', 'github', $3)`,
        [createId(), userId, "legacy-github-account"],
      );
      await pool.end();
      await adoptDrizzleBaseline(fixture.databaseUrl);
      await runMigrations(legacyDb.db, fixture.databaseUrl);

      const env = makeServerEnv(fixture.databaseUrl);
      const authConfig = parseAuthConfig(authEnv(), env);
      const runtime = createAuthRuntime({ db: legacyDb.db, config: authConfig });
      const { cookie } = await seedSession(runtime.auth, userId, { db: legacyDb });
      const session = await runtime.auth.api.getSession({
        headers: new Headers({ cookie }),
      });
      assert.equal(session?.user.id, userId);
      assert.equal(session?.user.emailVerified, true);
    } finally {
      await legacyDb.shutdown();
      await fixture.stop();
    }
  });
});
