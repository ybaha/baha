import assert from "node:assert/strict";
import { it } from "node:test";
import { notifyVisit, createVisitDedupeStore, createVisitEventStore } from "../../server/src/services/visits.ts";
import { sanitizeVisitPayload } from "../../server/src/services/visit-data.ts";

const payload = {
  ip: "192.0.2.1", city: "City", region: "Region", country: "Country", location: "0,0",
  userAgent: "UA", platform: "OS", language: "en", vendor: "", screenResolution: "1x1",
  windowSize: "1x1", timestamp: "2026-10-18T10:00:00.000Z",
  pageUrl: "https://ybaha.com/?token=secret", referrer: "https://example.com/?email=private",
};

function fixture(overrides = {}) {
  const rows = new Map();
  let sends = 0;
  const recorder = {
    async record(input) {
      if (rows.has(input.id)) return false;
      rows.set(input.id, { ...input, notificationStatus: "pending" });
      return true;
    },
    async retryFailed(id, newAttemptId, recoverFromAttemptId) {
      const row = rows.get(id);
      if (!row || (row.notificationStatus !== "failed" && !(row.notificationStatus === "pending" && recoverFromAttemptId === row.attemptId))) return false;
      row.notificationStatus = "pending";
      row.attemptId = newAttemptId;
      return true;
    },
    async setNotificationStatus(id, attemptId, notificationStatus, at, failureCode) {
      if (rows.get(id)?.attemptId === attemptId) Object.assign(rows.get(id), { notificationStatus, failureCode, at });
    },
  };
  const deps = {
    nodeEnv: "production", botToken: "synthetic-token", chatId: "synthetic-chat", recorder,
    events: createVisitEventStore(),
    transport: async () => { sends++; return Response.json({ ok: true }); },
    ...overrides,
  };
  const dedupe = createVisitDedupeStore();
  const notify = (id = "event-1", ip = "203.0.113.1") => notifyVisit(deps, payload, ip, dedupe, { id, encrypted: true });
  return { deps, rows, notify, recorder, sends: () => sends };
}

it("stores sanitized accepted visits and marks confirmed Telegram delivery", async () => {
  const api = fixture();
  assert.deepEqual(await api.notify(), { status: "ok", delivery: "sent", stored: true });
  const row = api.rows.get("event-1");
  assert.deepEqual(row.payload, sanitizeVisitPayload(payload));
  assert.equal(row.payload.pageUrl, "https://ybaha.com/");
  assert.equal(row.payload.referrer, "https://example.com/");
  assert.equal(row.trustedIp, "203.0.113.1");
  assert.equal(row.encrypted, true);
  assert.equal(row.notificationStatus, "sent");
});

it("coalesces concurrent retries of one event and prevents replay across process-local stores", async () => {
  const api = fixture();
  const results = await Promise.all([api.notify(), api.notify(), api.notify()]);
  assert.equal(api.rows.size, 1);
  assert.equal(api.sends(), 1);
  assert.ok(results.every((result) => result.delivery === "sent"));
  api.deps.events = createVisitEventStore();
  assert.equal((await api.notify()).delivery, "deduplicated");
  assert.equal(api.sends(), 1);
});

it("records separate visits from the same IP while throttling Telegram only", async () => {
  const api = fixture();
  await api.notify("first");
  assert.equal((await api.notify("second")).delivery, "deduplicated");
  assert.equal(api.rows.size, 2);
  assert.equal(api.rows.get("second").notificationStatus, "deduplicated");
  assert.equal(api.sends(), 1);
});

it("reports Telegram failure and permits a retry without inserting a second visit", async () => {
  let calls = 0;
  const api = fixture({ transport: async () => {
    calls++;
    return calls === 1 ? new Response(null, { status: 503 }) : Response.json({ ok: true });
  } });
  assert.equal((await api.notify()).delivery, "failed");
  assert.equal(api.rows.get("event-1").notificationStatus, "failed");
  assert.equal(api.rows.get("event-1").failureCode, "telegram_http_503");
  assert.equal((await api.notify()).delivery, "sent");
  assert.equal(api.rows.size, 1);
  assert.equal(calls, 2);
});

it("recovers a known failed alert even when persisting the failure status failed", async () => {
  let calls = 0;
  const api = fixture({ transport: async () => ++calls === 1
    ? new Response(null, { status: 503 }) : Response.json({ ok: true }) });
  const update = api.recorder.setNotificationStatus;
  let failedWrite = false;
  api.recorder.setNotificationStatus = async (...args) => {
    if (args[2] === "failed" && !failedWrite) {
      failedWrite = true;
      throw new Error("temporary status-write failure");
    }
    return update(...args);
  };
  assert.equal((await api.notify()).delivery, "failed");
  assert.equal(api.rows.get("event-1").notificationStatus, "pending");
  assert.equal((await api.notify()).delivery, "sent");
  assert.equal(api.rows.get("event-1").notificationStatus, "sent");
  assert.equal(api.rows.size, 1);
  assert.equal(calls, 2);
});

it("records new events even when the bounded cache is full", async () => {
  for (const pending of [false, true]) {
    const api = fixture();
    for (let i = 0; i < 1000; i++) api.deps.events.set(`cached-${i}`, {
      until: Date.now() + 300000, pending, failed: false, recovery: {},
      result: Promise.resolve({ status: "ok", delivery: "sent", stored: true }),
    });
    assert.equal((await api.notify()).delivery, "sent");
    assert.equal(api.rows.size, 1);
    assert.equal(api.sends(), 1);
    assert.equal(api.deps.events.size, 1000);
  }
});

it("protects failed-write recovery hints from cache eviction and coalesces retries at capacity", async () => {
  let calls = 0;
  const api = fixture({ transport: async () => ++calls === 1
    ? new Response(null, { status: 503 }) : Response.json({ ok: true }) });
  const update = api.recorder.setNotificationStatus;
  api.recorder.setNotificationStatus = async (...args) => {
    if (args[2] === "failed") throw new Error("status acknowledgement lost");
    return update(...args);
  };
  await api.notify();
  assert.ok(api.deps.events.get("event-1").recovery.attemptId);
  for (let i = 0; i < 999; i++) api.deps.events.set(`pending-${i}`, {
    until: Date.now() + 300000, pending: true, failed: false, recovery: {},
    result: Promise.resolve({ status: "ok", delivery: "sent", stored: true }),
  });
  assert.equal((await api.notify("another-event", "203.0.113.2")).delivery, "sent");
  assert.ok(api.deps.events.has("event-1"));
  const results = await Promise.all([api.notify(), api.notify()]);
  assert.ok(results.every((result) => result.delivery === "sent"));
  assert.equal(calls, 3);
  assert.equal(api.rows.size, 2);
});

it("does not mark a Telegram API rejection with HTTP 200 as delivered", async () => {
  const api = fixture({ transport: async () => Response.json({ ok: false, description: "rejected" }) });
  assert.equal((await api.notify()).delivery, "failed");
  assert.equal(api.rows.get("event-1").notificationStatus, "failed");
});

it("still sends when history writes fail and does not retry a successful send after a status-write failure", async () => {
  const missing = fixture({ recorder: { record: async () => { throw new Error("missing table"); } } });
  assert.deepEqual(await missing.notify(), { status: "ok", delivery: "sent", stored: false });
  assert.equal(missing.sends(), 1);
  const status = fixture();
  status.recorder.setNotificationStatus = async () => { throw new Error("DB unavailable"); };
  assert.equal((await status.notify()).delivery, "sent");
  await status.notify();
  assert.equal(status.sends(), 1);
});

it("records disabled delivery honestly without consuming the notification throttle", async () => {
  const api = fixture({ botToken: "" });
  assert.deepEqual(await api.notify(), { status: "ok", delivery: "disabled", stored: true });
  assert.equal(api.rows.get("event-1").notificationStatus, "skipped");
  assert.equal(api.sends(), 0);
});

it("never records or delivers visits in development", async () => {
  const api = fixture({ nodeEnv: "development" });
  assert.deepEqual(await api.notify(), { status: "ok", delivery: "disabled", stored: false });
  assert.equal(api.rows.size, 0);
});
