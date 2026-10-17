import assert from "node:assert/strict";
import { execSync, spawn } from "node:child_process";
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { after, before, describe, it } from "node:test";

import { createORPCClient, isDefinedError } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { StandardRPCJsonSerializer, StandardRPCSerializer } from "@orpc/client/standard";
import { SimpleCsrfProtectionLinkPlugin } from "@orpc/client/plugins";
import { ORPCError } from "@orpc/client";
import { sql, eq } from "drizzle-orm";
import pgDriver from "pg";

import { CSRF_HEADER_NAME, CSRF_HEADER_VALUE, createApp } from "../../server/src/app.ts";
import { createId } from "../../server/src/lib/ids.ts";
import { createDatabase } from "../../server/src/db/client.ts";
import { runMigrations } from "../../server/src/db/migrate.ts";
import { comments, postViews, users, votes } from "../../server/src/db/schema.ts";
import { parseAuthConfig, parseServerEnv } from "../../server/src/env.ts";
import {
  adoptDrizzleBaseline,
  assertBaselineSchema,
  migrationChecksums,
  verifyMigrationLedger,
} from "../../server/scripts/schema-tools.mjs";
import { applyLegacyInitSql } from "./legacy-baseline.mjs";
import { startLoopbackPostgres } from "./server-pg.mjs";

const repoRoot = join(fileURLToPath(new URL(".", import.meta.url)), "../..");
const manifest = JSON.parse(
  readFileSync(join(repoRoot, "server/src/slug-manifest.json"), "utf8"),
);
const knownSlug = manifest.writingSlugs[0];
assert.ok(knownSlug, "manifest must include a writing slug");

let pg;
let database;
let sessionUserId = null;
let sessionLookups = 0;
let sessionResolverThrows = false;
let baseUrl;
let socketPeer = "203.0.113.10";
const listeners = new Set();
const rpcSerializer = new StandardRPCSerializer(new StandardRPCJsonSerializer());
const encodeInput = (input) => JSON.stringify(rpcSerializer.serialize(input));
const decodeResponse = async (response) => rpcSerializer.deserialize(await response.json());

function makeEnv(databaseUrl, overrides = {}) {
  return parseServerEnv({
    NODE_ENV: "test",
    DATABASE_URL: databaseUrl,
    HOST: "127.0.0.1",
    PORT: "0",
    API_READ_ORIGINS: "http://127.0.0.1:3100,https://preview.pages.dev",
    API_WRITE_ORIGINS: "http://127.0.0.1:3100",
    API_PREVIEW_READ_ORIGINS: "https://preview.pages.dev",
    API_BODY_LIMIT_BYTES: "4096",
    ...overrides,
  });
}

async function startHttpServer(extra = {}) {
  const env = makeEnv(pg.databaseUrl, extra.env ?? {});
  const { app } = createApp({
    env,
    database,
    getSession: async () => {
      sessionLookups += 1;
      if (sessionResolverThrows) {
        throw new Error("session resolver failed");
      }
      return sessionUserId ? { user: { id: sessionUserId, name: "Test User" } } : null;
    },
    slugManifestPath: join(repoRoot, "server/src/slug-manifest.json"),
    telegramTransport: extra.telegramTransport ?? (async () => ({ ok: true })),
    resolveSocketPeer: () => socketPeer,
    ...extra.app,
  });
  const { serve } = await import("@hono/node-server");
  return await new Promise((resolve) => {
    const listener = serve({ fetch: app.fetch, hostname: "127.0.0.1", port: 0 }, (info) => {
      resolve({
        baseUrl: `http://127.0.0.1:${info.port}`,
        close: () => new Promise((done) => {
          listener.close(() => { listeners.delete(listener); done(); });
          listener.closeAllConnections();
        }),
      });
    });
    listeners.add(listener);
  });
}

function makeClient(origin = "http://127.0.0.1:3100", options = {}) {
  const link = new RPCLink({
    url: `${options.baseUrl ?? baseUrl}/rpc`,
    fetch: (request, init) =>
      fetch(request, {
        ...init,
        headers: {
          ...Object.fromEntries(new Headers(init?.headers ?? {})),
          origin,
          ...(options.cookie ? { cookie: options.cookie } : {}),
          ...(options.csrf === false
            ? {}
            : { [CSRF_HEADER_NAME]: CSRF_HEADER_VALUE }),
        },
      }),
    plugins: [new SimpleCsrfProtectionLinkPlugin()],
  });
  return createORPCClient(link);
}

before(async () => {
  pg = await startLoopbackPostgres();
  database = createDatabase({ connectionString: pg.databaseUrl });
  await runMigrations(database.db, pg.databaseUrl);
  const started = await startHttpServer();
  baseUrl = started.baseUrl;
});

after(async () => {
  try {
    await Promise.all([...listeners].map((listener) => new Promise((done) => {
      listener.close(done);
      listener.closeAllConnections();
    })));
  } finally {
    try {
      await database?.shutdown();
    } finally {
      await pg?.stop();
    }
  }
});

async function seedUser(label) {
  const id = `user-${label}-${Date.now()}`;
  await database.db.insert(users).values({
    id,
    email: `${label}-${Date.now()}@example.com`,
    name: `${label} Name`,
  });
  return id;
}

async function countComments() {
  const rows = await database.db.select({ count: sql`count(*)::int` }).from(comments);
  return rows[0]?.count ?? 0;
}

describe("server oRPC HTTP", { timeout: 20_000 }, () => {
  it("maps unknown slug create to VALIDATION with HTTP 400", async () => {
    sessionUserId = await seedUser("slug-check");
    const client = makeClient();
    try {
      await client.comments.create({ postSlug: "not-a-real-slug", text: "hello" });
      assert.fail("expected validation error");
    } catch (error) {
      assert.ok(error instanceof ORPCError);
      assert.equal(error.code, "VALIDATION");
      assert.equal(error.status, 400);
      assert.ok(isDefinedError(error));
      assert.equal(error.data?.message, "Post slug is invalid.");
    }
  });

  it("requires auth for comment create and vote toggle", async () => {
    const client = makeClient();
    sessionUserId = null;
    await assert.rejects(
      () => client.comments.create({ postSlug: knownSlug, text: "hello" }),
      (error) => error instanceof ORPCError && error.code === "UNAUTHORIZED",
    );
    const author = await seedUser("author");
    const [comment] = await database.db
      .insert(comments)
      .values({
        id: `c-${Date.now()}`,
        text: "seed",
        postSlug: knownSlug,
        userId: author,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    await assert.rejects(
      () => client.votes.toggle({ commentId: comment.id, liked: true }),
      (error) => error instanceof ORPCError && error.code === "UNAUTHORIZED",
    );
  });

  it("keeps simultaneous users and subsequent anonymous requests isolated", async (t) => {
    const alice = await seedUser("session-alice");
    const bob = await seedUser("session-bob");
    const id = createId();
    const postSlug = `session-isolation-${Date.now()}`;
    const now = new Date();
    await database.db.insert(comments).values({
      id, postSlug, text: "isolation", userId: alice, createdAt: now, updatedAt: now,
    });
    await database.db.insert(votes).values([
      { id: createId(), commentId: id, userId: alice, value: 1, createdAt: now, updatedAt: now },
      { id: createId(), commentId: id, userId: bob, value: -1, createdAt: now, updatedAt: now },
    ]);
    let lookups = 0;
    const started = await startHttpServer({ app: {
      getSession: async (headers) => {
        lookups += 1;
        await new Promise((done) => setImmediate(done));
        const cookie = headers.get("cookie");
        const userId = cookie === "test-session=alice" ? alice
          : cookie === "test-session=bob" ? bob : null;
        return userId ? { user: { id: userId } } : null;
      },
    } });
    t.after(started.close);
    const aliceClient = makeClient(undefined, { baseUrl: started.baseUrl, cookie: "test-session=alice" });
    const bobClient = makeClient(undefined, { baseUrl: started.baseUrl, cookie: "test-session=bob" });
    const [a, b] = await Promise.all([
      aliceClient.comments.list({ postSlug }), bobClient.comments.list({ postSlug }),
    ]);
    assert.equal(a.comments[0].currentUserVote, 1);
    assert.equal(b.comments[0].currentUserVote, -1);
    const anonymous = await makeClient(undefined, { baseUrl: started.baseUrl }).comments.list({ postSlug });
    assert.equal(anonymous.comments[0].currentUserVote, 0);
    assert.equal(lookups, 3);
  });

  it("rejects malformed input with the declared validation error", async () => {
    await assert.rejects(() => makeClient().votes.toggle({ commentId: "x", liked: "yes" }),
      (error) => isDefinedError(error) && error.code === "VALIDATION" && error.status === 400);
  });

  it("cannot bypass missing real auth config with a legacy configured flag", () => {
    const serverEnv = makeEnv(pg.databaseUrl, { NODE_ENV: "production" });
    assert.throws(
      () =>
        parseAuthConfig(
          {
            NODE_ENV: "production",
            API_AUTH_CONFIGURED: "true",
          },
          serverEnv,
        ),
      /API_AUTH_SECRET/,
    );
  });

  it("resolves session at most once per request", async () => {
    sessionUserId = await seedUser("session-once");
    sessionLookups = 0;
    const client = makeClient();
    await client.comments.list({ postSlug: knownSlug, limit: 5 });
    assert.equal(sessionLookups, 1);
  });

  it("maps session resolver failures to UNAVAILABLE", async () => {
    sessionResolverThrows = true;
    sessionLookups = 0;
    const client = makeClient();
    try {
      await client.comments.list({ postSlug: knownSlug, limit: 5 });
      assert.fail("expected unavailable");
    } catch (error) {
      assert.ok(error instanceof ORPCError);
      assert.equal(error.code, "UNAVAILABLE");
      assert.equal(error.status, 503);
    } finally {
      sessionResolverThrows = false;
    }
  });

  it("enforces write origin and CSRF on mutations", async () => {
    sessionUserId = await seedUser("writer");
    const badOrigin = makeClient("https://evil.test");
    try {
      await badOrigin.comments.create({ postSlug: knownSlug, text: "nope" });
      assert.fail("expected forbidden");
    } catch (error) {
      assert.ok(error instanceof ORPCError);
      assert.equal(error.code, "FORBIDDEN");
    }

    const response = await fetch(`${baseUrl}/rpc/views/increment`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "http://127.0.0.1:3100",
      },
      body: encodeInput({ slug: knownSlug }),
    });
    assert.equal(response.status, 403);
    const payload = await decodeResponse(response);
    assert.equal(payload.code, "FORBIDDEN");
    assert.equal(payload.defined, true);
  });

  it("denies preview origin writes but allows reads", async () => {
    sessionUserId = await seedUser("preview-user");
    const preview = makeClient("https://preview.pages.dev");
    await assert.rejects(() =>
      preview.comments.create({ postSlug: knownSlug, text: "blocked" }),
    );
    const page = await preview.comments.list({ postSlug: knownSlug, limit: 5 });
    assert.ok(Array.isArray(page.comments));
  });

  it("returns privacy-safe comment JSON", async () => {
    const author = await seedUser("privacy");
    const id = createId();
    const createdAt = new Date("2024-01-02T03:04:05.000Z");
    await database.db.insert(comments).values({
      id,
      text: "hello",
      postSlug: knownSlug,
      userId: author,
      createdAt,
      updatedAt: createdAt,
    });
    const client = makeClient();
    const page = await client.comments.list({ postSlug: knownSlug, limit: 50 });
    const row = page.comments.find((comment) => comment.id === id);
    assert.ok(row);
    assert.equal(row.createdAt, createdAt.toISOString());
    assert.equal(row.user.name, "privacy Name");
    assert.ok(!("email" in row.user));
    assert.ok(!("userId" in row));
    const raw = JSON.stringify(row);
    assert.ok(!raw.includes("@example.com"));
  });

  it("paginates equal createdAt cursor boundaries and rejects foreign cursors", async () => {
    const pageSlug = `pagination-${Date.now()}`;
    const otherSlug = `other-${Date.now()}`;
    const author = await seedUser("pager");
    const sameTime = new Date("2025-06-01T12:00:00.000Z");
    const ids = [createId(), createId(), createId()];
    for (const id of ids) {
      await database.db.insert(comments).values({
        id,
        text: id,
        postSlug: pageSlug,
        userId: author,
        createdAt: sameTime,
        updatedAt: sameTime,
      });
    }
    const [otherComment] = await database.db
      .insert(comments)
      .values({
        id: createId(),
        text: "other",
        postSlug: otherSlug,
        userId: author,
        createdAt: sameTime,
        updatedAt: sameTime,
      })
      .returning();
    const client = makeClient();
    const first = await client.comments.list({ postSlug: pageSlug, limit: 2 });
    assert.equal(first.comments.length, 2);
    const second = await client.comments.list({
      postSlug: pageSlug,
      limit: 2,
      cursor: first.nextCursor,
    });
    assert.equal(first.comments.length + second.comments.length, 3);
    await assert.rejects(
      () => client.comments.list({ postSlug: pageSlug, limit: 2, cursor: "missing" }),
      (error) => error instanceof ORPCError && error.code === "NOT_FOUND",
    );
    await assert.rejects(
      () =>
        client.comments.list({
          postSlug: pageSlug,
          limit: 2,
          cursor: otherComment.id,
        }),
      (error) => error instanceof ORPCError && error.code === "NOT_FOUND",
    );
  });

  it("allows exactly one concurrent success when quota already has nine comments", async () => {
    sessionUserId = await seedUser("quota");
    const client = makeClient();
    for (let i = 0; i < 9; i += 1) {
      await client.comments.create({ postSlug: knownSlug, text: `seed-${i}` });
    }
    const attempts = await Promise.allSettled(
      Array.from({ length: 8 }, () =>
        client.comments.create({ postSlug: knownSlug, text: "overflow" }),
      ),
    );
    const successes = attempts.filter((a) => a.status === "fulfilled");
    const quotaFailures = attempts.filter(
      (a) => a.status === "rejected" && a.reason instanceof ORPCError && a.reason.code === "QUOTA_EXCEEDED",
    );
    assert.equal(successes.length, 1);
    assert.equal(quotaFailures.length, 7);
    for (const failure of quotaFailures) {
      assert.equal(failure.reason.status, 429);
    }
  });

  it("serializes vote toggles with even/odd parity", async () => {
    const author = await seedUser("comment-author");
    sessionUserId = await seedUser("voter");
    const [comment] = await database.db
      .insert(comments)
      .values({
        id: `c-vote-${Date.now()}`,
        text: "v",
        postSlug: knownSlug,
        userId: author,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    const client = makeClient();
    const even = await Promise.all([
      client.votes.toggle({ commentId: comment.id, liked: true }),
      client.votes.toggle({ commentId: comment.id, liked: true }),
    ]);
    assert.deepEqual(even.map((r) => r.value), [1, 0]);
    const odd = await client.votes.toggle({ commentId: comment.id, liked: true });
    assert.equal(odd.value, 1);
    const opposite = await Promise.all([
      client.votes.toggle({ commentId: comment.id, liked: true }),
      client.votes.toggle({ commentId: comment.id, liked: false }),
    ]);
    assert.ok(opposite.some((r) => r.value === 1 || r.value === -1));
    const rows = await database.db.select().from(votes).where(eq(votes.commentId, comment.id));
    assert.ok(rows.length <= 1);
  });

  it("returns NOT_FOUND for missing vote targets", async () => {
    sessionUserId = await seedUser("missing-target");
    const client = makeClient();
    await assert.rejects(
      () => client.votes.toggle({ commentId: "missing-comment", liked: true }),
      (error) => error instanceof ORPCError && error.code === "NOT_FOUND",
    );
  });

  it("increments views concurrently", async () => {
    const client = makeClient();
    const slug = knownSlug;
    await Promise.all(Array.from({ length: 8 }, () => client.views.increment({ slug })));
    const map = await client.views.get({ slugs: [slug] });
    assert.equal(map[slug], 8);
  });

  it("rejects GET mutations without DB writes", async () => {
    const before = await countComments();
    const response = await fetch(`${baseUrl}/rpc/comments/create`, {
      method: "GET",
      headers: { origin: "http://127.0.0.1:3100" },
    });
    assert.notEqual(response.status, 200);
    const after = await countComments();
    assert.equal(before, after);
  });

  it("enforces streamed payload limits without content-length", async () => {
    const big = "x".repeat(5000);
    const response = await fetch(`${baseUrl}/rpc/views/increment`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "http://127.0.0.1:3100",
        [CSRF_HEADER_NAME]: CSRF_HEADER_VALUE,
      },
      body: new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(big));
          controller.close();
        },
      }),
      duplex: "half",
    });
    assert.equal(response.status, 413);
    const payload = await decodeResponse(response);
    assert.equal(payload.code, "PAYLOAD_TOO_LARGE");
  });

  it("keeps the 8KB visit cap on canonical and trailing-slash paths", async (t) => {
    const started = await startHttpServer({ env: { API_BODY_LIMIT_BYTES: "65536" } });
    t.after(started.close);
    const body = encodeInput({
      ip: "test", city: "c", region: "r", country: "co", location: "0,0",
      userAgent: "ua", platform: "p", language: "en", vendor: "",
      screenResolution: "1x1", windowSize: "1x1", timestamp: new Date().toISOString(),
    }) + " ".repeat(8192);
    for (const suffix of ["", "/"]) {
      const response = await fetch(`${started.baseUrl}/rpc/visits/notify${suffix}`, {
        method: "POST",
        headers: { "content-type": "application/json", origin: "http://127.0.0.1:3100", [CSRF_HEADER_NAME]: CSRF_HEADER_VALUE },
        body,
      });
      assert.equal(response.status, 413);
      assert.equal((await decodeResponse(response)).code, "PAYLOAD_TOO_LARGE");
    }
  });

  it("uses credentialed CORS without wildcard", async () => {
    const response = await fetch(`${baseUrl}/healthz`, {
      headers: { origin: "http://127.0.0.1:3100" },
    });
    assert.equal(response.headers.get("access-control-allow-origin"), "http://127.0.0.1:3100");
    assert.notEqual(response.headers.get("access-control-allow-origin"), "*");
  });

  it("dedupes visits per trusted peer IP", async (t) => {
    let calls = 0;
    const transport = async () => {
      calls += 1;
      return { ok: true };
    };
    const started = await startHttpServer({
      env: { NODE_ENV: "production", TELEGRAM_BOT_TOKEN: "test-token" },
      telegramTransport: transport,
    });
    t.after(async () => {
      socketPeer = "203.0.113.10";
      await started.close();
    });
    const localBase = started.baseUrl;
    const payload = {
      ip: "1.2.3.4",
      city: "c",
      region: "r",
      country: "co",
      location: "0,0",
      userAgent: "ua",
      platform: "p",
      language: "en",
      vendor: "",
      screenResolution: "1x1",
      windowSize: "1x1",
      timestamp: new Date().toISOString(),
    };
    const post = () =>
      fetch(`${localBase}/rpc/visits/notify`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://127.0.0.1:3100",
          [CSRF_HEADER_NAME]: CSRF_HEADER_VALUE,
        },
        body: encodeInput(payload),
      });
    socketPeer = "203.0.113.11";
    assert.equal((await post()).status, 200);
    assert.equal((await post()).status, 200);
    assert.equal(calls, 1);
    socketPeer = "203.0.113.12";
    assert.equal((await post()).status, 200);
    assert.equal(calls, 2);
  });

  it("exposes health and readiness", async () => {
    const health = await fetch(`${baseUrl}/healthz`);
    assert.equal(health.status, 200);
    const ready = await fetch(`${baseUrl}/readyz`);
    assert.equal(ready.status, 200);
  });
});

describe("drizzle baseline tooling", () => {
  it("refuses adopt on empty database", async () => {
    const fresh = await startLoopbackPostgres();
    try {
      await assert.rejects(() => adoptDrizzleBaseline(fresh.databaseUrl));
    } finally {
      await fresh.stop();
    }
  });

  it("rejects baseline drift before writing migration metadata", async () => {
    const fixture = await startLoopbackPostgres();
    const pool = new pgDriver.Pool({ connectionString: fixture.databaseUrl });
    try {
      await pool.query(readFileSync(join(repoRoot, "prisma/migrations/0_init/migration.sql"), "utf8"));
      const cases = [
        ['ALTER TABLE "Vote" ALTER COLUMN "value" SET DEFAULT -1', 'ALTER TABLE "Vote" ALTER COLUMN "value" SET DEFAULT 1'],
        ['ALTER TABLE "Comment" DROP CONSTRAINT "Comment_userId_fkey"', 'ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE'],
        ['ALTER TABLE "Comment" ALTER COLUMN "createdAt" TYPE TIMESTAMP(6)', 'ALTER TABLE "Comment" ALTER COLUMN "createdAt" TYPE TIMESTAMP(3)'],
        ['DROP INDEX "Vote_userId_commentId_key"', 'CREATE UNIQUE INDEX "Vote_userId_commentId_key" ON "Vote"("userId", "commentId")'],
        ['DROP INDEX "Vote_userId_commentId_key"; CREATE UNIQUE INDEX "Vote_userId_commentId_key" ON "Vote"("userId", "commentId") WHERE "value" = 1', 'DROP INDEX "Vote_userId_commentId_key"; CREATE UNIQUE INDEX "Vote_userId_commentId_key" ON "Vote"("userId", "commentId")'],
      ];
      for (const [change, restore] of cases) {
        await pool.query(change);
        await assert.rejects(() => adoptDrizzleBaseline(fixture.databaseUrl), /does not match/);
        const ledger = await pool.query("SELECT to_regclass('drizzle.__drizzle_migrations') AS ledger");
        assert.equal(ledger.rows[0].ledger, null);
        await pool.query(restore);
      }
      await assertBaselineSchema(fixture.databaseUrl);
    } finally {
      await pool.end();
      await fixture.stop();
    }
  });

  it("waits for concurrent index DDL and rechecks the committed schema", async () => {
    const fixture = await startLoopbackPostgres();
    const pool = new pgDriver.Pool({ connectionString: fixture.databaseUrl });
    const ddl = await pool.connect();
    let transactionOpen = false;
    let adoption;
    try {
      await pool.query(readFileSync(join(repoRoot, "prisma/migrations/0_init/migration.sql"), "utf8"));
      await ddl.query("BEGIN");
      transactionOpen = true;
      await ddl.query('CREATE INDEX "concurrent_test_idx" ON "Comment" ("postSlug")');
      let settled = false;
      adoption = adoptDrizzleBaseline(fixture.databaseUrl).then(
        () => { settled = true; return null; },
        (error) => { settled = true; return error; },
      );
      let waiting = false;
      const deadline = Date.now() + 5000;
      while (!settled && Date.now() < deadline) {
        const result = await pool.query("SELECT 1 FROM pg_stat_activity WHERE datname = current_database() AND wait_event_type = 'Lock' AND query LIKE 'LOCK TABLE%' LIMIT 1");
        if (result.rowCount) { waiting = true; break; }
        await new Promise((done) => setTimeout(done, 20));
      }
      await ddl.query("COMMIT");
      transactionOpen = false;
      const error = await adoption;
      assert.equal(waiting, true, "adoption must wait for concurrent index creation");
      assert.match(error?.message ?? "", /schema changed|does not match/);
      assert.equal((await pool.query("SELECT to_regclass('drizzle.__drizzle_migrations') AS ledger")).rows[0].ledger, null);
    } finally {
      if (transactionOpen) await ddl.query("ROLLBACK");
      await adoption;
      ddl.release();
      await pool.end();
      await fixture.stop();
    }
  });

  it("adopts baseline then applies 0001 with parity and rejects checksum tampering", async () => {
    const checksums = migrationChecksums();
    const tags = checksums.map((entry) => entry.tag);
    assert.deepEqual(tags.slice(0, 2), [
      "0000_initial",
      "0001_comment_post_slug_idx",
    ]);
    assert.ok(tags.includes("0002_better_auth"));
    const adoptedDb = await startLoopbackPostgres();
    const migratedDb = await startLoopbackPostgres();
    try {
      await applyLegacyInitSql(adoptedDb.databaseUrl, repoRoot);
      const adoptResult = await adoptDrizzleBaseline(adoptedDb.databaseUrl);
      assert.equal(adoptResult.adopted, true);
      const adoptedBundle = createDatabase({ connectionString: adoptedDb.databaseUrl });
      await runMigrations(adoptedBundle.db, adoptedDb.databaseUrl);

      const freshBundle = createDatabase({ connectionString: migratedDb.databaseUrl });
      await runMigrations(freshBundle.db, migratedDb.databaseUrl);
      const [adoptedViews, freshViews] = await Promise.all([
        adoptedBundle.pool.query(
          "SELECT indexname FROM pg_indexes WHERE indexname = 'Comment_postSlug_idx'",
        ),
        freshBundle.pool.query(
          "SELECT indexname FROM pg_indexes WHERE indexname = 'Comment_postSlug_idx'",
        ),
      ]);
      assert.equal(adoptedViews.rowCount, 1);
      assert.equal(freshViews.rowCount, 1);
      await adoptedBundle.shutdown();
      await freshBundle.shutdown();

      const tampered = await startLoopbackPostgres();
      try {
        await applyLegacyInitSql(tampered.databaseUrl, repoRoot);
        await adoptDrizzleBaseline(tampered.databaseUrl);
        const pool = new pgDriver.Pool({ connectionString: tampered.databaseUrl });
        await pool.query(
          "UPDATE drizzle.__drizzle_migrations SET hash = $1 WHERE id = 1",
          ["deadbeef"],
        );
        await pool.end();
        await assert.rejects(() => verifyMigrationLedger(tampered.databaseUrl));
      } finally {
        await tampered.stop();
      }
    } finally {
      await adoptedDb.stop();
      await migratedDb.stop();
    }
  });
});

describe("compiled server artifact", () => {
  it("starts from unrelated cwd and serves health", async () => {
    execSync("node scripts/build-server.mjs", { cwd: repoRoot, stdio: "pipe" });
    const smokePg = await startLoopbackPostgres();
    const tmpCwd = mkdtempSync(join(tmpdir(), "baha-server-smoke-"));
    const child = spawn(
      process.execPath,
      [join(repoRoot, "server/dist/main.js")],
      {
        cwd: tmpCwd,
        env: {
          ...process.env,
          NODE_ENV: "test",
          DATABASE_URL: smokePg.databaseUrl,
          HOST: "127.0.0.1",
          PORT: "0",
          API_READ_ORIGINS: "http://127.0.0.1:3100",
          API_WRITE_ORIGINS: "http://127.0.0.1:3100",
          API_BASE_URL: "http://127.0.0.1:8787",
          API_AUTH_SECRET: "smoke-test-auth-secret-32chars-min!!",
          GITHUB_CLIENT_ID: "smoke-github-id",
          GITHUB_CLIENT_SECRET: "smoke-github-secret",
          GOOGLE_CLIENT_ID: "smoke-google-id",
          GOOGLE_CLIENT_SECRET: "smoke-google-secret",
        },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    try {
      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("server startup timeout")), 10_000);
        child.stdout.on("data", (chunk) => {
          const text = chunk.toString();
          const match = text.match(/API listening on http:\/\/(127\.0\.0\.1|\[::1\]):(\d+)/);
          if (match) {
            clearTimeout(timer);
            resolve(`http://127.0.0.1:${match[2]}`);
          }
        });
        child.on("exit", (code) => reject(new Error(`server exited ${code}`)));
      }).then(async (url) => {
        const health = await fetch(`${url}/healthz`);
        assert.equal(health.status, 200);
      });
    } finally {
      child.kill("SIGTERM");
      await smokePg.stop();
      rmSync(tmpCwd, { recursive: true, force: true });
    }
  });
});
