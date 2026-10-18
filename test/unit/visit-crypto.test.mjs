import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { describe, it } from "node:test";

import { createRequire } from "node:module";
const { encryptVisit } = createRequire(import.meta.url)("../../src/lib/visit-crypto.ts");
import { createVisitCipher } from "../../server/src/services/visit-crypto.ts";
import { parseServerEnv } from "../../server/src/env.ts";

if (!globalThis.crypto) {
  globalThis.crypto = webcrypto;
}

const SECRET_A =
  "visit-cipher-secret-with-sufficient-entropy-aaaaaaaa";
const SECRET_B =
  "visit-cipher-secret-with-sufficient-entropy-bbbbbbbb";

const basePayload = {
  ip: "192.0.2.44",
  city: "İstanbul 🌍",
  region: "Marmara",
  country: "Turkey",
  location: "41.01,28.97",
  userAgent: "Mozilla/5.0 (test)",
  platform: "MacIntel",
  language: "tr-TR",
  vendor: "Test vendor",
  screenResolution: "1440x900",
  windowSize: "1200x800",
  pageUrl: "https://ybaha.com/private-path?token=secret",
  referrer: "https://example.com/from",
  pageTitle: "Unicode title — test",
  timezone: "Europe/Istanbul",
  organization: "ISP",
  postalCode: "34000",
  timestamp: "2026-10-08T12:00:00.000Z",
};

function eventId() {
  return crypto.randomUUID();
}

async function encryptWithSecret(payload, secret, now = Date.now) {
  const cipher = createVisitCipher(secret, now);
  const key = cipher.publicKey();
  const envelope = await encryptVisit(payload, key, eventId());
  return { cipher, key, envelope };
}

function expectInvalid(fn) {
  assert.throws(fn, (error) => {
    assert.equal(error.message, "Invalid encrypted visit.");
    return true;
  });
}

describe("visit-crypto", () => {
  it("uses the existing auth secret when the optional visit secret is blank", () => {
    const env = { DATABASE_URL: "postgresql://fixture:fixture@127.0.0.1:1/unused", API_AUTH_SECRET: SECRET_A };
    assert.equal(parseServerEnv({ ...env, VISIT_ENCRYPTION_SECRET: "  " }).visitEncryptionSecret, SECRET_A);
    assert.equal(parseServerEnv({ ...env, VISIT_ENCRYPTION_SECRET: SECRET_B }).visitEncryptionSecret, SECRET_B);
    assert.throws(() => parseServerEnv({ ...env, VISIT_ENCRYPTION_SECRET: "short" }));
  });

  it("roundtrips unicode visit payloads", async () => {
    const now = () => 1_700_000_000_000;
    const { cipher, envelope } = await encryptWithSecret(basePayload, SECRET_A, now);
    const decoded = cipher.decrypt(envelope);
    assert.deepEqual(decoded, basePayload);
  });

  it("derives a stable public key for the same secret", () => {
    const a = createVisitCipher(SECRET_A).publicKey();
    const b = createVisitCipher(SECRET_A).publicKey();
    assert.equal(a.keyId, b.keyId);
    assert.equal(a.publicKey, b.publicKey);
    assert.equal(a.version, 1);
  });

  it("uses different keys for different secrets and rejects cross-decrypt", async () => {
    const now = () => 1_700_000_000_000;
    const left = createVisitCipher(SECRET_A, now).publicKey();
    const right = createVisitCipher(SECRET_B, now).publicKey();
    assert.notEqual(left.keyId, right.keyId);
    assert.notEqual(left.publicKey, right.publicKey);

    const envelope = await encryptVisit(basePayload, left, eventId());
    const decryptB = createVisitCipher(SECRET_B, now);
    expectInvalid(() => decryptB.decrypt(envelope));
  });

  it("rejects empty and short secrets at cipher creation", () => {
    assert.throws(() => createVisitCipher(""));
    assert.throws(() => createVisitCipher("short-secret"));
  });

  it("binds sentAt to serverTime instead of the browser clock", async () => {
    const serverTime = 1_800_000_000_000;
    const cipher = createVisitCipher(SECRET_A, () => serverTime);
    const key = cipher.publicKey();
    assert.equal(key.serverTime, serverTime);
    const envelope = await encryptVisit(basePayload, key, eventId());
    assert.equal(envelope.sentAt, serverTime);
    assert.deepEqual(cipher.decrypt(envelope), basePayload);
  });

  it("does not leak plaintext context into ciphertext or public config", async () => {
    const { cipher, key, envelope } = await encryptWithSecret(basePayload, SECRET_A);
    const serialized = JSON.stringify(envelope);
    assert.equal(serialized.includes(basePayload.ip), false);
    assert.equal(serialized.includes("ybaha.com"), false);
    assert.equal("privateKey" in key, false);
    assert.deepEqual(Object.keys(key).sort(), [
      "keyId",
      "publicKey",
      "serverTime",
      "version",
    ]);
    assert.deepEqual(cipher.decrypt(envelope), basePayload);
  });

  it("accepts max-size plaintext and rejects larger payloads", async () => {
    const now = () => 1_700_000_000_000;
    const cipher = createVisitCipher(SECRET_A, now);
    const key = cipher.publicKey();
    let pad = 8_000;
    let maxPayload;
    let encoded;
    do {
      maxPayload = {
        ...basePayload,
        userAgent: "x".repeat(pad),
      };
      encoded = new TextEncoder().encode(JSON.stringify(maxPayload));
      pad -= 1;
    } while (encoded.length > 8_192 && pad > 0);
    assert.equal(encoded.length, 8_192);
    const envelope = await encryptVisit(maxPayload, key, eventId());
    assert.deepEqual(cipher.decrypt(envelope), maxPayload);

    const tooLarge = {
      ...maxPayload,
      userAgent: `${maxPayload.userAgent}x`,
    };
    assert.ok(
      new TextEncoder().encode(JSON.stringify(tooLarge)).length > 8_192,
    );
    await assert.rejects(() => encryptVisit(tooLarge, key, eventId()));
  });

  it("rejects stale and far-future sentAt timestamps", async () => {
    const current = 2_000_000_000_000;
    const staleCipher = createVisitCipher(SECRET_A, () => current - 400_000);
    const staleEnvelope = await encryptVisit(
      basePayload,
      staleCipher.publicKey(),
      eventId(),
    );
    const freshCipher = createVisitCipher(SECRET_A, () => current);
    expectInvalid(() => freshCipher.decrypt(staleEnvelope));

    const futureCipher = createVisitCipher(SECRET_A, () => current + 60_000);
    const futureEnvelope = await encryptVisit(
      basePayload,
      futureCipher.publicKey(),
      eventId(),
    );
    expectInvalid(() => freshCipher.decrypt(futureEnvelope));
  });

  it("rejects malformed encodings, lengths, and oversize ciphertext", async () => {
    const now = () => 1_700_000_000_000;
    const { cipher, envelope } = await encryptWithSecret(basePayload, SECRET_A, now);
    assert.deepEqual(cipher.decrypt(envelope), basePayload);

    expectInvalid(() => cipher.decrypt({ ...envelope, keyId: "UPPERCASE-NOT-ALLOWED!!!!" }));
    expectInvalid(() => cipher.decrypt({ ...envelope, eventId: "not-a-uuid" }));
    expectInvalid(() => cipher.decrypt({ ...envelope, ephemeralPublicKey: "a" }));
    expectInvalid(() => cipher.decrypt({ ...envelope, salt: "short" }));
    expectInvalid(() => cipher.decrypt({ ...envelope, iv: "short" }));
    expectInvalid(() => cipher.decrypt({ ...envelope, ciphertext: "YQ" }));
    expectInvalid(() =>
      cipher.decrypt({ ...envelope, ephemeralPublicKey: `${envelope.ephemeralPublicKey}=` }),
    );

    const huge = `${envelope.ciphertext}${"A".repeat(12_000)}`;
    expectInvalid(() => cipher.decrypt({ ...envelope, ciphertext: huge }));
  });

  it("rejects tampering of ciphertext, iv, salt, peer key, eventId, and sentAt", async () => {
    const now = () => 1_700_000_000_000;
    const { cipher, envelope } = await encryptWithSecret(basePayload, SECRET_A, now);

    const flip = (value) => {
      const chars = value.split("");
      chars[chars.length - 1] = chars[chars.length - 1] === "a" ? "b" : "a";
      return chars.join("");
    };

    expectInvalid(() => cipher.decrypt({ ...envelope, ciphertext: flip(envelope.ciphertext) }));
    expectInvalid(() => cipher.decrypt({ ...envelope, iv: flip(envelope.iv) }));
    expectInvalid(() => cipher.decrypt({ ...envelope, salt: flip(envelope.salt) }));
    expectInvalid(() =>
      cipher.decrypt({ ...envelope, ephemeralPublicKey: flip(envelope.ephemeralPublicKey) }),
    );
    expectInvalid(() => cipher.decrypt({ ...envelope, eventId: eventId() }));
    expectInvalid(() => cipher.decrypt({ ...envelope, sentAt: envelope.sentAt + 1 }));
  });
});
