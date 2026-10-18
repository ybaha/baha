import type {
  EncryptedVisitDto,
  VisitNotifyInputDto,
  VisitPublicKeyDto,
} from "@baha/contracts";

const PROTOCOL_VERSION = 1;
const HKDF_INFO = "baha:visits:v1:payload";
const AAD_LABEL = "baha:visits:v1";
const MAX_PLAINTEXT_BYTES = 8192;
const P256_PUBLIC_KEY_BYTES = 65;
const SALT_BYTES = 16;
const IV_BYTES = 12;
const KEY_ID_RE = /^[0-9a-f]{32}$/;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const BASE64URL_RE = /^[A-Za-z0-9_-]+$/;

function requireSubtle(): SubtleCrypto {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error("Web Crypto is not available.");
  }
  return subtle;
}

function encodeBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeBase64Url(value: string, exactLength?: number): Uint8Array<ArrayBuffer> {
  if (typeof value !== "string" || value.length === 0 || value.length > 87 || !BASE64URL_RE.test(value)) {
    throw new Error("Invalid public key.");
  }
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "===".slice((base64.length + 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  if (bytes.length === 0 || encodeBase64Url(bytes) !== value) {
    throw new Error("Invalid public key.");
  }
  if (exactLength !== undefined && bytes.length !== exactLength) {
    throw new Error("Invalid public key.");
  }
  return bytes;
}

function buildAad(
  keyId: string,
  eventId: string,
  sentAt: number,
  ephemeralPublicKey: string,
  salt: string,
  iv: string,
): Uint8Array<ArrayBuffer> {
  return new TextEncoder().encode(
    JSON.stringify([
      AAD_LABEL,
      keyId,
      eventId,
      sentAt,
      ephemeralPublicKey,
      salt,
      iv,
    ]),
  );
}

function validatePublicKey(key: VisitPublicKeyDto): Uint8Array<ArrayBuffer> {
  if (
    key?.version !== PROTOCOL_VERSION ||
    typeof key.keyId !== "string" ||
    typeof key.publicKey !== "string" ||
    typeof key.serverTime !== "number" ||
    !Number.isSafeInteger(key.serverTime)
  ) {
    throw new Error("Invalid visit public key.");
  }
  if (!KEY_ID_RE.test(key.keyId)) {
    throw new Error("Invalid visit public key.");
  }
  const publicKeyBytes = decodeBase64Url(key.publicKey, P256_PUBLIC_KEY_BYTES);
  if (publicKeyBytes[0] !== 0x04) {
    throw new Error("Invalid visit public key.");
  }
  return publicKeyBytes;
}

function validateEventId(eventId: string): void {
  if (!UUID_RE.test(eventId)) {
    throw new Error("Invalid visit event id.");
  }
}

async function importPeerPublicKey(
  subtle: SubtleCrypto,
  publicKeyBytes: Uint8Array<ArrayBuffer>,
): Promise<CryptoKey> {
  return subtle.importKey(
    "raw",
    publicKeyBytes,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    [],
  );
}

async function derivePayloadKey(
  subtle: SubtleCrypto,
  sharedSecret: ArrayBuffer,
  salt: Uint8Array<ArrayBuffer>,
): Promise<CryptoKey> {
  const ikm = await subtle.importKey("raw", sharedSecret, "HKDF", false, [
    "deriveKey",
  ]);
  return subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt,
      info: new TextEncoder().encode(HKDF_INFO),
    },
    ikm,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"],
  );
}

export async function encryptVisit(
  payload: VisitNotifyInputDto,
  key: VisitPublicKeyDto,
  eventId: string,
): Promise<EncryptedVisitDto> {
  const subtle = requireSubtle();
  validateEventId(eventId);
  const serverPublicKeyBytes = validatePublicKey(key);
  const plaintext = new TextEncoder().encode(JSON.stringify(payload));
  if (plaintext.length > MAX_PLAINTEXT_BYTES) {
    throw new Error("Visit payload is too large.");
  }

  const ephemeral = await subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"],
  );
  const serverPublicKey = await importPeerPublicKey(subtle, serverPublicKeyBytes);
  const sharedBits = await subtle.deriveBits(
    { name: "ECDH", public: serverPublicKey },
    ephemeral.privateKey,
    256,
  );

  const ephemeralPublicKeyBytes = new Uint8Array(
    await subtle.exportKey("raw", ephemeral.publicKey),
  );
  if (
    ephemeralPublicKeyBytes.length !== P256_PUBLIC_KEY_BYTES ||
    ephemeralPublicKeyBytes[0] !== 0x04
  ) {
    throw new Error("Failed to create visit cipher.");
  }

  const salt = new Uint8Array(SALT_BYTES);
  const iv = new Uint8Array(IV_BYTES);
  crypto.getRandomValues(salt);
  crypto.getRandomValues(iv);

  const aesKey = await derivePayloadKey(subtle, sharedBits, salt);
  const ephemeralPublicKey = encodeBase64Url(ephemeralPublicKeyBytes);
  const saltEncoded = encodeBase64Url(salt);
  const ivEncoded = encodeBase64Url(iv);
  const sentAt = key.serverTime;
  const aad = buildAad(
    key.keyId,
    eventId,
    sentAt,
    ephemeralPublicKey,
    saltEncoded,
    ivEncoded,
  );

  const ciphertextBytes = new Uint8Array(
    await subtle.encrypt(
      { name: "AES-GCM", iv, additionalData: aad, tagLength: 128 },
      aesKey,
      plaintext,
    ),
  );

  return {
    version: PROTOCOL_VERSION,
    keyId: key.keyId,
    eventId,
    sentAt,
    ephemeralPublicKey,
    salt: saltEncoded,
    iv: ivEncoded,
    ciphertext: encodeBase64Url(ciphertextBytes),
  };
}
