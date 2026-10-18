import assert from "node:assert/strict";
import { it } from "node:test";
import { serve } from "@hono/node-server";
import { createORPCClient, isDefinedError } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { SimpleCsrfProtectionLinkPlugin } from "@orpc/client/plugins";
import { createApp } from "../../server/src/app.ts";
import { parseServerEnv } from "../../server/src/env.ts";

const origin = "http://localhost:3100";
const preview = "https://visit-preview.pages.dev";
const payload = () => ({
  ip: "reported-ip", city: "City", region: "Region", country: "Country",
  location: "0,0", userAgent: "browser", platform: "platform", language: "en",
  vendor: "", screenResolution: "100x100", windowSize: "100x100", timestamp: new Date().toISOString(),
});

async function fixture(t, transport, overrides = {}) {
  let peer = "203.0.113.10";
  const env = parseServerEnv({
    NODE_ENV: "production", DATABASE_URL: "postgresql://fixture:fixture@127.0.0.1:1/unused",
    API_READ_ORIGINS: origin, API_WRITE_ORIGINS: origin, API_PREVIEW_READ_ORIGINS: preview,
    TELEGRAM_BOT_TOKEN: "synthetic-visit-fixture-token", TELEGRAM_CHAT_ID: "synthetic-chat",
    ...overrides,
  });
  const { app } = createApp({
    env,
    database: { db: {}, ping: async () => false, shutdown: async () => {} },
    getSession: async () => { throw new Error("Visit notifications must not resolve sessions"); },
    telegramTransport: transport,
    resolveSocketPeer: () => peer,
  });
  let server;
  const baseUrl = await new Promise((done) => {
    server = serve({ fetch: app.fetch, hostname: "127.0.0.1", port: 0 }, (info) => done(`http://127.0.0.1:${info.port}`));
  });
  t.after(() => new Promise((done) => {
    server.close(done);
    server.closeAllConnections();
  }));
  const client = (requestOrigin = origin) => createORPCClient(new RPCLink({
    url: `${baseUrl}/rpc`,
    headers: { origin: requestOrigin },
    plugins: [new SimpleCsrfProtectionLinkPlugin()],
  }));
  return { client, baseUrl, setPeer: (value) => { peer = value; } };
}

it("rejects malformed visit fields and dates before delivery", async (t) => {
  let deliveries = 0;
  const api = await fixture(t, async () => { deliveries += 1; return new Response(); });
  for (const invalid of [
    { ...payload(), timestamp: "invalid" },
    { ...payload(), userAgent: 42 },
    { ...payload(), pageUrl: "x".repeat(2049) },
    { ...payload(), referrer: 42 },
    { ...payload(), timezone: "x".repeat(101) },
  ]) {
    await assert.rejects(() => api.client().visits.notify(invalid),
      (error) => isDefinedError(error) && error.code === "VALIDATION" && error.status === 400);
  }
  assert.equal(deliveries, 0);
});

it("formats, sanitizes and deduplicates using the trusted peer rather than body IP", async (t) => {
  const delivered = [];
  const api = await fixture(t, async (_url, init) => { delivered.push(JSON.parse(init.body)); return new Response(); });
  await api.client().visits.notify({ ...payload(), city: "City\nInjected", userAgent: "UA\r\nInjected" });
  await api.client().visits.notify({ ...payload(), ip: "different-reported-ip" });
  assert.equal(delivered.length, 1);
  assert.equal(delivered[0].chat_id, "synthetic-chat");
  assert.match(delivered[0].text, /New Visit/);
  assert.match(delivered[0].text, /City Injected/);
  assert.match(delivered[0].text, /UA  Injected/);
  assert.doesNotMatch(delivered[0].text, /\nInjected/);
  api.setPeer("203.0.113.11");
  await api.client().visits.notify(payload());
  assert.equal(delivered.length, 2);
});

it("delivers richer context without URL secrets and identifies the server-observed IP", async (t) => {
  const delivered = [];
  const api = await fixture(t, async (_url, init) => { delivered.push(JSON.parse(init.body)); return new Response(); });
  await api.client().visits.notify({
    ...payload(), pageUrl: "https://ybaha.com/?token=secret#private",
    referrer: "https://example.com/article?email=private", pageTitle: "Baha",
    timezone: "Europe/Amsterdam", organization: "Example ISP", postalCode: "3011",
  });
  assert.equal(delivered.length, 1);
  const message = delivered[0];
  assert.match(message.text, /Page: https:\/\/ybaha.com\//);
  assert.match(message.text, /Referrer: https:\/\/example.com\/article/);
  assert.match(message.text, /IP \(server\): 203\.0\.113\.10/);
  assert.match(message.text, /IP \(location lookup\): reported-ip/);
  assert.match(message.text, /Example ISP/);
  assert.doesNotMatch(message.text, /secret|private/);
  assert.deepEqual(message.link_preview_options, { is_disabled: true });
});

it("keeps delivery failures best-effort and allows a retry for the same peer", async (t) => {
  let deliveries = 0;
  const api = await fixture(t, async () => {
    deliveries += 1;
    return new Response(null, { status: deliveries === 1 ? 503 : 200 });
  });
  assert.deepEqual(await api.client().visits.notify(payload()), { status: "ok" });
  assert.deepEqual(await api.client().visits.notify(payload()), { status: "ok" });
  assert.equal(deliveries, 2);
});

it("aborts stalled Telegram delivery without breaking the visit response", { timeout: 10000 }, async (t) => {
  const api = await fixture(t, async (_url, init) => new Promise((_resolve, reject) => {
    init.signal.addEventListener("abort", () => reject(init.signal.reason), { once: true });
  }));
  assert.deepEqual(await api.client().visits.notify(payload()), { status: "ok" });
});

it("does not deliver in development or without an optional bot token", async (t) => {
  let deliveries = 0;
  for (const config of [{ NODE_ENV: "development" }, { TELEGRAM_BOT_TOKEN: "" }]) {
    const api = await fixture(t, async () => { deliveries += 1; return new Response(); }, config);
    assert.deepEqual(await api.client().visits.notify(payload()), { status: "ok" });
  }
  assert.equal(deliveries, 0);
});

it("blocks preview notifications and keeps the retired location endpoint inert", async (t) => {
  let deliveries = 0;
  const api = await fixture(t, async () => { deliveries += 1; return new Response(); });
  await assert.rejects(() => api.client(preview).visits.notify(payload()),
    (error) => isDefinedError(error) && error.code === "FORBIDDEN" && error.status === 403);
  const gone = await fetch(`${api.baseUrl}/api/send-location`, { method: "POST" });
  assert.equal(gone.status, 410);
  assert.equal(deliveries, 0);
});
