import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { after, before, describe, it } from "node:test";

import { createORPCClient, isDefinedError } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { SimpleCsrfProtectionLinkPlugin } from "@orpc/client/plugins";
import { ORPCError } from "@orpc/client";

import { CSRF_HEADER_NAME, CSRF_HEADER_VALUE, createApp } from "../../server/src/app.ts";
import { createDatabase } from "../../server/src/db/client.ts";
import { runMigrations } from "../../server/src/db/migrate.ts";
import { parseServerEnv } from "../../server/src/env.ts";
import { users } from "../../server/src/db/schema.ts";
import { startLoopbackPostgres } from "./server-pg.mjs";

const repoRoot = join(fileURLToPath(new URL(".", import.meta.url)), "../..");
const manifest = JSON.parse(
  readFileSync(join(repoRoot, "server/src/slug-manifest.json"), "utf8"),
);
const knownSlug = manifest.writingSlugs[0];

let pg;
let database;
let sessionUserId = null;
let baseUrl;
const listeners = new Set();

function makeEnv(databaseUrl) {
  return parseServerEnv({
    NODE_ENV: "test",
    DATABASE_URL: databaseUrl,
    HOST: "127.0.0.1",
    PORT: "0",
    API_READ_ORIGINS: "http://127.0.0.1:3100",
    API_WRITE_ORIGINS: "http://127.0.0.1:3100",
    API_BODY_LIMIT_BYTES: "4096",
  });
}

async function startHttpServer() {
  const env = makeEnv(pg.databaseUrl);
  const { app } = createApp({
    env,
    database,
    getSession: async () =>
      sessionUserId ? { user: { id: sessionUserId, name: "Test User" } } : null,
    slugManifestPath: join(repoRoot, "server/src/slug-manifest.json"),
  });
  const { serve } = await import("@hono/node-server");
  return await new Promise((resolve) => {
    const listener = serve({ fetch: app.fetch, hostname: "127.0.0.1", port: 0 }, (info) => {
      resolve({
        baseUrl: `http://127.0.0.1:${info.port}`,
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

async function seedUser(label) {
  const id = `user-${label}-${Date.now()}`;
  await database.db.insert(users).values({
    id,
    email: `${label}-${Date.now()}@example.com`,
    name: `${label} Name`,
  });
  return id;
}

function makeClient() {
  const link = new RPCLink({
    url: `${baseUrl}/rpc`,
    fetch: (request, init) =>
      fetch(request, {
        ...init,
        headers: {
          ...Object.fromEntries(new Headers(init?.headers ?? {})),
          origin: "http://127.0.0.1:3100",
          [CSRF_HEADER_NAME]: CSRF_HEADER_VALUE,
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
  await Promise.all(
    [...listeners].map(
      (listener) =>
        new Promise((done) => {
          listener.close(done);
          listener.closeAllConnections();
        }),
    ),
  );
  await database?.shutdown();
  await pg?.stop();
});

describe("comments policy over HTTP", () => {
  it("rejects empty / oversized / unknown-slug inputs", async () => {
    sessionUserId = await seedUser("validation");
    const client = makeClient();
    await assert.rejects(
      () => client.comments.create({ postSlug: knownSlug, text: "   " }),
      (error) => isDefinedError(error) && error.code === "VALIDATION",
    );
    await assert.rejects(
      () => client.comments.create({ postSlug: knownSlug, text: "a".repeat(1500) }),
      (error) => isDefinedError(error) && error.code === "VALIDATION",
    );
    await assert.rejects(
      () => client.comments.create({ postSlug: "bad slug", text: "hi" }),
      (error) => isDefinedError(error) && error.code === "VALIDATION",
    );
  });

  it("enforces daily quota", async () => {
    sessionUserId = await seedUser("quota");
    const client = makeClient();
    for (let i = 0; i < 10; i += 1) {
      await client.comments.create({ postSlug: knownSlug, text: `comment ${i + 1}` });
    }
    await assert.rejects(
      () => client.comments.create({ postSlug: knownSlug, text: "overflow" }),
      (error) => error instanceof ORPCError && error.code === "QUOTA_EXCEEDED",
    );
  });

  it("toggles votes without unique-constraint failures", async () => {
    sessionUserId = await seedUser("voter");
    const client = makeClient();
    const created = await client.comments.create({ postSlug: knownSlug, text: "votable" });
    const up = await client.votes.toggle({ commentId: created.id, liked: true });
    assert.equal(up.value, 1);
    const off = await client.votes.toggle({ commentId: created.id, liked: true });
    assert.equal(off.value, 0);
    const down = await client.votes.toggle({ commentId: created.id, liked: false });
    assert.equal(down.value, -1);
  });

  it("rejects unknown post slugs for view increment", async () => {
    const client = makeClient();
    await assert.rejects(
      () => client.views.increment({ slug: "not-a-real-slug" }),
      (error) => error instanceof ORPCError && error.code === "NOT_FOUND",
    );
  });
});
