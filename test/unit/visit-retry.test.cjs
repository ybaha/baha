"use strict";
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { it } = require("node:test");
const vm = require("node:vm");
const ts = require("@typescript/typescript6");

function loadSender(reply) {
  const source = readFileSync(join(__dirname, "../../src/lib/visit-notify.ts"), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  let keys = 0;
  let ids = 0;
  const envelopes = [];
  const delays = [];
  const exports = {};
  vm.runInNewContext(outputText, {
    exports,
    crypto: { randomUUID: () => { ids++; return "one-stable-event-id"; } },
    console: { warn() {} },
    setTimeout(callback, ms) { delays.push(ms); callback(); },
    require(name) {
      if (name === "@/lib/api") return { api: { visits: {
        publicKey: async () => ({ keyId: `key-${++keys}` }),
        notifyEncrypted: async (envelope) => { envelopes.push(envelope); return reply(envelopes.length); },
        notify: () => { throw new Error("Plaintext must never be sent"); },
      } } };
      if (name === "@/lib/visit-crypto") return { encryptVisit: async (_payload, key, eventId) => ({
        eventId, keyId: key.keyId, ciphertext: "encrypted-context",
      }) };
      throw new Error(`Unexpected import: ${name}`);
    },
  });
  return { send: exports.notifyEncryptedVisit, envelopes, delays, keys: () => keys, ids: () => ids };
}

it("retries failed delivery with a refreshed key and a stable event ID, never plaintext", async () => {
  const sender = loadSender((attempt) => ({ status: "ok", delivery: attempt === 1 ? "failed" : "sent" }));
  assert.equal((await sender.send({ ip: "private-ip" })).delivery, "sent");
  assert.equal(sender.ids(), 1);
  assert.equal(sender.keys(), 2);
  assert.deepEqual(sender.delays, [500]);
  assert.equal(sender.envelopes[0].eventId, sender.envelopes[1].eventId);
  assert.notEqual(sender.envelopes[0].keyId, sender.envelopes[1].keyId);
  assert.ok(!JSON.stringify(sender.envelopes).includes("private-ip"));
});

it("caps failures at three attempts without falling back to plaintext", async () => {
  const sender = loadSender(() => { throw new Error("API unavailable"); });
  await assert.rejects(() => sender.send({}), /API unavailable/);
  assert.equal(sender.envelopes.length, 3);
  assert.deepEqual(sender.delays, [500, 1500]);
});

it("does not retry successful, disabled or throttled delivery", async () => {
  for (const delivery of ["sent", "disabled", "deduplicated"]) {
    const sender = loadSender(() => ({ status: "ok", delivery }));
    assert.equal((await sender.send({})).delivery, delivery);
    assert.equal(sender.envelopes.length, 1);
    assert.equal(sender.delays.length, 0);
  }
});
