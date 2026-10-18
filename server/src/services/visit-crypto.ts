import {
  createDecipheriv,
  createECDH,
  createHash,
  hkdfSync,
} from "node:crypto";
import type {
  EncryptedVisitDto,
  VisitPublicKeyDto,
} from "@baha/contracts";

const INVALID_MESSAGE = "Invalid encrypted visit.";
const PROTOCOL_VERSION = 1;
const SERVER_KEY_SALT = "baha:visits:v1:server-key";
const HKDF_INFO = "baha:visits:v1:payload";
const AAD_LABEL = "baha:visits:v1";
const MAX_PLAINTEXT_BYTES = 8192;
const MAX_CIPHERTEXT_BYTES = 8208;
const P256_PUBLIC_KEY_BYTES = 65;
const SALT_BYTES = 16;
const IV_BYTES = 12;
const GCM_TAG_BYTES = 16;
const STALE_MS = 300_000;
const FUTURE_MS = 30_000;
const KEY_ID_RE = /^[0-9a-f]{32}$/;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const BASE64URL_RE = /^[A-Za-z0-9_-]+$/;

function invalid(): Error {
  return new Error(INVALID_MESSAGE);
}

function decodeBase64Url(value: string, exactLength?: number): Buffer {
  const maxLength = exactLength === undefined ? 10944 : Math.ceil(exactLength * 4 / 3);
  if (typeof value !== "string" || value.length === 0 || value.length > maxLength || !BASE64URL_RE.test(value)) {
    throw invalid();
  }
  let decoded: Buffer;
  try {
    decoded = Buffer.from(value, "base64url");
  } catch {
    throw invalid();
  }
  if (decoded.length === 0 || decoded.toString("base64url") !== value) {
    throw invalid();
  }
  if (exactLength !== undefined && decoded.length !== exactLength) {
    throw invalid();
  }
  return decoded;
}

function encodeBase64Url(bytes: Buffer): string {
  return bytes.toString("base64url");
}

function buildAad(
  keyId: string,
  eventId: string,
  sentAt: number,
  ephemeralPublicKey: string,
  salt: string,
  iv: string,
): Buffer {
  return Buffer.from(
    JSON.stringify([
      AAD_LABEL,
      keyId,
      eventId,
      sentAt,
      ephemeralPublicKey,
      salt,
      iv,
    ]),
    "utf8",
  );
}

function derivePayloadKey(sharedSecret: Buffer, salt: Buffer): Buffer {
  return Buffer.from(
    hkdfSync(
      "sha256",
      sharedSecret,
      salt,
      Buffer.from(HKDF_INFO, "utf8"),
      32,
    ),
  );
}

function deriveServerKeyMaterial(secret: string): {
  privateKey: Buffer;
  publicKeyRaw: Buffer;
  keyId: string;
  publicKeyEncoded: string;
} {
  for (let counter = 0; counter < 16; counter++) {
    const candidate = Buffer.from(hkdfSync(
      "sha256",
      Buffer.from(secret, "utf8"),
      Buffer.from(SERVER_KEY_SALT, "utf8"),
      Buffer.from(`p256:${counter}`, "utf8"),
      32,
    ));
    try {
      const ecdh = createECDH("prime256v1");
      ecdh.setPrivateKey(candidate);
      const publicKeyRaw = ecdh.getPublicKey(undefined, "uncompressed");
      if (publicKeyRaw.length !== P256_PUBLIC_KEY_BYTES || publicKeyRaw[0] !== 0x04) {
        continue;
      }
      const keyId = createHash("sha256")
        .update(publicKeyRaw)
        .digest("hex")
        .slice(0, 32);
      return {
        privateKey: Buffer.from(candidate),
        publicKeyRaw: Buffer.from(publicKeyRaw),
        keyId,
        publicKeyEncoded: encodeBase64Url(Buffer.from(publicKeyRaw)),
      };
    } catch {
      continue;
    }
  }
  throw new Error("Failed to derive visit cipher key.");
}

function validateSentAt(sentAt: unknown, now: () => number): void {
  if (typeof sentAt !== "number" || !Number.isSafeInteger(sentAt)) {
    throw invalid();
  }
  const current = now();
  if (current - sentAt > STALE_MS || sentAt - current > FUTURE_MS) {
    throw invalid();
  }
}

function validateEnvelopeShape(envelope: EncryptedVisitDto): void {
  if (
    envelope?.version !== PROTOCOL_VERSION ||
    typeof envelope.keyId !== "string" ||
    typeof envelope.eventId !== "string" ||
    typeof envelope.ephemeralPublicKey !== "string" ||
    typeof envelope.salt !== "string" ||
    typeof envelope.iv !== "string" ||
    typeof envelope.ciphertext !== "string"
  ) {
    throw invalid();
  }
  if (!KEY_ID_RE.test(envelope.keyId) || !UUID_RE.test(envelope.eventId)) {
    throw invalid();
  }
}

export function createVisitCipher(
  secret: string,
  now: () => number = Date.now,
): {
  publicKey(): VisitPublicKeyDto;
  decrypt(envelope: EncryptedVisitDto): unknown;
} {
  if (typeof secret !== "string" || secret.length < 32) {
    throw new Error("Visit cipher secret must be at least 32 characters.");
  }

  const material = deriveServerKeyMaterial(secret);

  return {
    publicKey(): VisitPublicKeyDto {
      return {
        version: PROTOCOL_VERSION,
        keyId: material.keyId,
        publicKey: material.publicKeyEncoded,
        serverTime: now(),
      };
    },

    decrypt(envelope: EncryptedVisitDto): unknown {
      try {
        validateEnvelopeShape(envelope);
        if (envelope.keyId !== material.keyId) {
          throw invalid();
        }
        validateSentAt(envelope.sentAt, now);

        const peerPublicKey = decodeBase64Url(
          envelope.ephemeralPublicKey,
          P256_PUBLIC_KEY_BYTES,
        );
        if (peerPublicKey[0] !== 0x04) {
          throw invalid();
        }
        const salt = decodeBase64Url(envelope.salt, SALT_BYTES);
        const iv = decodeBase64Url(envelope.iv, IV_BYTES);
        const ciphertext = decodeBase64Url(envelope.ciphertext);
        if (
          ciphertext.length < GCM_TAG_BYTES ||
          ciphertext.length > MAX_CIPHERTEXT_BYTES
        ) {
          throw invalid();
        }

        const ecdh = createECDH("prime256v1");
        ecdh.setPrivateKey(material.privateKey);
        const sharedSecret = ecdh.computeSecret(peerPublicKey);
        const aesKey = derivePayloadKey(sharedSecret, salt);
        const aad = buildAad(
          envelope.keyId,
          envelope.eventId,
          envelope.sentAt,
          envelope.ephemeralPublicKey,
          envelope.salt,
          envelope.iv,
        );

        const tag = ciphertext.subarray(ciphertext.length - GCM_TAG_BYTES);
        const encrypted = ciphertext.subarray(0, ciphertext.length - GCM_TAG_BYTES);
        const decipher = createDecipheriv("aes-256-gcm", aesKey, iv);
        decipher.setAAD(aad);
        decipher.setAuthTag(tag);
        const plaintext = Buffer.concat([
          decipher.update(encrypted),
          decipher.final(),
        ]);
        if (plaintext.length > MAX_PLAINTEXT_BYTES) {
          throw invalid();
        }
        return JSON.parse(plaintext.toString("utf8")) as unknown;
      } catch (error) {
        if (error instanceof Error && error.message === INVALID_MESSAGE) {
          throw error;
        }
        throw invalid();
      }
    },
  };
}
