# Visit notifications and history

## Rollout order

The static Cloudflare frontend and standalone API are separate deployments. A Git push does **not** apply database migrations or update the API process. The new frontend must not be published before the API supports `visits.publicKey` and `visits.notifyEncrypted`; it deliberately never falls back to sending plaintext.

1. Review/backup the intended database and authorize the additive migration separately. `server/drizzle/0003_visits.sql` creates only `Visit` and its indexes. Existing migration checksums and the baseline fingerprint are unchanged.
2. Apply committed migrations using the existing `runMigrationsForBundle` helper and the intended API environment. For an approved checkout with development tooling present, from the repository root:

   ```sh
   node --env-file=server/.env --import tsx --input-type=module -e '
   import { createDatabase } from "./server/src/db/client.ts";
   import { runMigrationsForBundle } from "./server/src/db/migrate.ts";
   if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL required");
   const bundle = createDatabase({ connectionString: process.env.DATABASE_URL });
   try { await runMigrationsForBundle(bundle); }
   finally { await bundle.shutdown(); }
   '
   ```

   This command is explicit administrative work, not a build/startup hook. Do not point it at an unverified database. Never paste database credentials into source, logs, or chat.
3. Build/deploy/restart the API with its existing random, high-entropy `API_AUTH_SECRET`, production `NODE_ENV`, Telegram bot token and chat ID. All replicas must share the encryption secret. Optionally configure a separate random `VISIT_ENCRYPTION_SECRET` (32+ characters); empty/unset uses the existing auth secret through domain-separated derivation. No new frontend secret/environment variable is needed.
4. Check `/healthz`: `visits.production`, `visits.telegramConfigured`, and `visits.encryptionConfigured` must be true. These booleans do not verify the token's validity, chat permissions, or successful delivery. `/readyz` checks database connectivity, not whether `Visit` has been migrated.
5. Publish the frontend. Its production API origin must use HTTPS. Make one authorized live homepage visit and check both the Telegram alert and the corresponding `Visit` row. Repeated visits from the same trusted IP are notification-throttled for 60 seconds, but distinct events still produce history rows.

No production migration or API deployment is performed by the implementation/tests in this change.

## Encrypted transport

The browser obtains the API public key at runtime, creates a fresh ephemeral P-256 ECDH key pair, derives an AES-256-GCM key using HKDF-SHA-256 and a random salt, and encrypts the complete context JSON. The private API key is domain-separated HKDF material from the server-only secret, validated as a P-256 scalar using platform cryptography. It is stable across restarts/replicas sharing the secret. It is never sent to the browser.

Authenticated metadata includes protocol version context, key ID, event UUID, server-provided timestamp, ephemeral public key, salt, and IV. The API accepts only bounded, canonical base64url values, validates the curve point, verifies GCM authentication, enforces a five-minute freshness window and validates decrypted fields against the normal visit schema. Server-provided time avoids rejecting visitors whose device clocks are wrong. On retry the browser refreshes the public key and re-encrypts with the **same event ID**, including after secret rotation.

This adds payload confidentiality/integrity on top of HTTPS, not visitor authentication or anonymity. Anyone can fetch the public key; origin, CSRF, body and IP-rate protections still apply. Requests still reveal ordinary network metadata. The existing approximate-location lookup remains an HTTPS call to `ipapi.co`. Browser/device/location fields remain untrusted/inferred.

Legacy `visits.notify` remains available to already-cached frontends during rollout. Those rows have `encrypted=false`; the new sender exclusively uses `notifyEncrypted`. There is no automatic plaintext downgrade if encryption or key discovery fails.

## Persistence and delivery

`Visit` contains one row per accepted event ID: server `receivedAt`, visitor-reported `visitedAt`, sanitized page/referrer context, approximate location, reported and server-observed IP, device metadata, an encrypted-transport flag, delivery status, optional notification time and a static failure code. URL credentials, queries and fragments are removed before browser transmission and again before persistence/formatting. No account/session lookup, identity association, public history endpoint, raw decrypted blob, ciphertext, encryption key or Telegram credential is stored.

The event ID is a database primary key. A bounded process-local in-flight/result cache coalesces retries; database insert conflicts suppress duplicate notifications across instances. A previously failed row can be atomically claimed for a retry. Each notification attempt has a separate server-generated ownership token; claims change that token, and status updates are fenced to the current owner. If saving a failure status loses its acknowledgement, only the process that knows the failed attempt can recover its still-owned pending row; it cannot steal another replica's pending retry. Recovery-bearing cache entries are protected from normal eviction. IP throttling occurs after persistence, so it suppresses alerts, not visit counts.

Statuses:
- `pending`: row accepted; delivery not yet finalized.
- `sent`: Telegram returned both a successful HTTP status and JSON `ok=true`.
- `failed`: transport timed out/failed or Telegram rejected the message; browser may retry, up to three attempts total.
- `skipped`: Telegram is not configured.
- `deduplicated`: the IP notification throttle suppressed the alert.

The RPC returns a non-sensitive `delivery` outcome (`sent`, `failed`, `disabled`, `deduplicated`) and `stored` boolean. Missing tables/database errors do not prevent Telegram delivery. Connection, query and database statement timeouts bound stalled work. Status-write failure does not turn an already successful send into a retry.

This is best-effort delivery, **not exactly once**: a crash between sending and saving status can leave a pending row, and a database outage weakens cross-instance duplicate protection. No durable outbox/retry worker is introduced. A `sent` row means Telegram accepted the message, not that someone read it.

## Troubleshooting

- No request: check the browser console, canonical hostname, production build and preview/auth-disabled policy. Localhost and `*.pages.dev` never send notifications.
- Public-key RPC unavailable: API deployment or secret configuration is missing; no plaintext fallback is attempted.
- `delivery=disabled`: check API `NODE_ENV` and `TELEGRAM_BOT_TOKEN`. Startup warns about a missing production token.
- `delivery=failed`: inspect the row's `failureCode` or the server's generic operational warning. `telegram_http_401` usually indicates token rejection; `telegram_http_400`/`403` requires checking chat configuration/permissions. Do not log the bot URL/token or full payload to diagnose it.
- `stored=false`: check that migration `0003_visits` was applied and that the API database is reachable. Alerts can still succeed in this state.
- No second alert on reload: the 60-second trusted-IP throttle is intentional. Confirm proxy trust is configured correctly so all traffic is not collapsed to one reverse-proxy IP.
- `pending` rows after a restart are not automatically resent. Investigate before retrying manually, because the message might already have been sent.

## Retention and private reporting

Encryption here is transport encryption. Decrypted visit metadata, including IP/location/device data, is stored in PostgreSQL and sent to the configured Telegram chat. Database access/backups and Telegram access must remain private. Choose a retention period appropriate for the site's privacy obligations; this change does not silently introduce a scheduled deletion policy. For example, an authorized maintenance task could delete rows older than 30 days using the indexed `receivedAt` column.

Example private aggregate query (no public endpoint):

```sql
SELECT date_trunc('day', "receivedAt") AS day,
       count(*) AS visits,
       count(*) FILTER (WHERE "notificationStatus" = 'sent') AS alerts_sent,
       count(*) FILTER (WHERE "notificationStatus" = 'failed') AS alerts_failed
FROM "Visit"
GROUP BY 1
ORDER BY 1 DESC;
```
