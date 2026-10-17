# @baha/server

Hono API for oRPC (`/rpc/*`), Better Auth (`/auth/*`), and health endpoints.

## Build and run

From the repository root:

```sh
npm ci
npm run build:server
# After separately provisioning/migrating the intended database and filling server/.env:
node --env-file=server/.env server/dist/main.js
```

The service defaults to `127.0.0.1:8787`. It uses real Better Auth; missing signing/provider configuration fails startup. Builds and startup never apply database migrations.

Production cutover requires a reviewed backup/migration runbook, the intended database target, an independently deployed API process/reverse proxy, and OAuth provider callbacks at `/auth/callback/github` and `/auth/callback/google` on the canonical API origin. Full provider callback flows still require an authorized staging smoke test. Retain legacy auth tables during the rollback window; identity reconciliation is a paused-write operation, not a permanent dual writer.

Pin this service to a supported Node 22 interpreter without changing the VPS's shared default runtime. Existing timestamp-without-time-zone columns follow Prisma's UTC contract; the API uses a UTC PostgreSQL session and Drizzle timestamp encoding. Verify historical data and the retained PostgreSQL major against staging before production migration. PostgreSQL 12 on the inspected VPS is EOL; upgrading it remains a separate infrastructure task.

## Environment variables

Names only; see `.env.example`.

| Name | Used for |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection |
| `HOST`, `PORT` | API listen address |
| `API_BASE_URL` | Canonical public API origin (Better Auth `baseURL`) |
| `API_AUTH_SECRET` | Better Auth signing/encryption secret |
| `API_READ_ORIGINS` | Browser read CORS allowlist |
| `API_WRITE_ORIGINS` | Browser write CORS + Better Auth `trustedOrigins` |
| `API_PREVIEW_READ_ORIGINS` | Optional read-only preview origins (not trusted for auth) |
| `API_TRUST_PROXY` | Honor forwarded client IP headers |
| `API_TRUSTED_PROXY_PEERS` | Trusted proxy peers for client IP resolution |
| `API_BODY_LIMIT_BYTES` | Request body size cap |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | GitHub OAuth |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google OAuth |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | Optional visit notifications |

Integration tests and `createApp` harnesses may inject a session resolver without mounting `/auth/*`.
