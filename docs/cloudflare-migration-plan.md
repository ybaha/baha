# Static Cloudflare Pages frontend + standalone typed API

Status: local implementation complete through checkpoint D. Static frontend and standalone API are built and validated. Production cutover (E) is not performed or approved. No production changes made.
Date: 2026-10-16
Source baseline: `a6ed7a5` in this worktree.

## Final local validation — 2026-10-17

- Typecheck and lint pass (10 existing, unrelated lint warnings); 67 unit and 57 integration tests pass. Both web and API builds pass.
- `out/` is entirely static: six public indexes, three writings, one vault detail, sitemap/robots and 404 output. No Next API routes, Server Actions or Next server process remain.
- A fresh scratch `npm ci` and web build succeeded without database/auth configuration or a generated Prisma fixture. The browser exercised real local API posting/voting, preserved expanded pagination, desktop/mobile deep links, theme/accent persistence, command search, client navigation, anonymous/read-only previews and API-offline draft retention. No JS page errors or missing static assets were observed.
- Browser evidence: `/var/folders/rk/ck6651nx4bq4x10z41_s0c3m0000gp/T/baha-static-e2e-27mvmcgs`; repeatable harness is `test/browser/static-export.py` with its owned API fixture. The optional browser test requires existing Playwright/Chromium and installs no browser tooling.
- Fresh builds exposed a pinned Google-font/Turbopack loader failure; Cormorant now uses supported `next/font/local` with the licensed font vendored. No dependency/framework patch or cache workaround.
- Confirmed against Cloudflare's static Next.js Pages guide: preset **Next.js (Static HTML Export)**, build **`npm run build:web`**, publish **`out`**. No runtime adapter or Pages Function needed.
- Remaining deployment gates: confirm the actual production database/backup, approve/rehearse migrations and API deployment, configure DNS/TLS/OAuth callbacks, and perform full GitHub/Google callback smoke tests on staging. The inspected PostgreSQL 12 upgrade is separate. Legacy Prisma exists only as a dev-only rollback test fixture.

## 1. Goal and boundaries

Keep Next.js for build-time rendering, routing, local MDX, metadata and the existing UI. Deploy its static HTML/CSS/JS/assets to Cloudflare Pages. Run a small, independently deployable Hono + oRPC + Drizzle/PostgreSQL service on the VPS. All application data calls from the frontend go through `src/lib/api.ts`; auth protocol calls use a small dedicated auth client.

Final frontend has **no `src/app/api/`, no Server Actions, no runtime database/auth server imports, and no Next server process**. Server Components may remain: they execute at build time. This is static generation with interactive browser islands, not a client-only SPA rewrite.

Preserve published URLs, MDX, SEO, navigation/search/filtering, themes, comments, votes, approximate view counts and existing database identities/data. No D1 migration, Tailwind migration, router rewrite, Redis, queue, Turborepo or unrelated UI redesign.

Planning is read-only apart from this document. Implementation/package installs require approval. Production inspection, credentials, database changes, DNS/OAuth configuration and deployment each require explicit authorization. No commits/pushes implied.

## 2. Evidence and reusable Karardex patterns

Three read-only subagents covered Karardex patterns, backend/data contracts, and frontend/static boundaries; the main session verified key sources and official documentation.

### This repository

- Public content is filesystem-backed: `src/lib/content/load.ts`, `selectors.ts`, `src/queries/writings.ts`. Keep these as build-time modules, not API endpoints.
- Writing/vault detail pages already enumerate static paths and metadata. Sitemap/robots are content-based.
- `src/app/layout.tsx` reads theme cookies despite `force-static`. Static HTML cannot personalize those cookies; move that behavior to browser initialization/CSS.
- Five files in `src/queries/` are Server Actions: comments list/create, vote toggle, views read/increment. They are the runtime coupling, not article rendering.
- The comments HTTP route already exists, but the actual UI calls actions. The final solution replaces both with one oRPC implementation.
- Auth is NextAuth v4 + Prisma adapter, GitHub/Google OAuth, database sessions. Replacing it needs an explicit migration decision.
- Seven existing PostgreSQL models and quoted SQL names are defined by `prisma/schema.prisma` and `prisma/migrations/0_init/migration.sql`.
- `LiveOperations` is browser-side simulation, not an API dependency.
- No standalone server/deployment configuration for this site was found. An owner-authorized, host-key-verified read-only check of the Retrophoto VPS found no portfolio-named PM2 process, deployment directory or systemd unit, and no active nginx vhost for `ybaha.com`/`api.ybaha.com`. A separate `bin-api.ybaha.com` service exists and is unrelated; leave it untouched. The portfolio's current production host/database target still needs verification through an approved deployment inventory, not guessed from other apps.

### Karardex: use implementation as reference, not a template to copy

| Reference under `/Users/baha/code/karardex/` | Reuse |
| --- | --- |
| `apps/server/src/app.ts` | Mount oRPC's Fetch handler inside Hono. |
| `apps/server/src/router/builder.ts` | Public/protected procedures and server-side session checks. |
| `apps/web/src/lib/rpc-client.ts` | `RPCLink`, `createORPCClient`, credentialed fetch. |
| `packages/db/src/client.ts` | One bounded `pg.Pool`, Drizzle integration, health and shutdown helpers. |
| `apps/server/src/auth.ts` | Better Auth + Drizzle integration, if approved. |
| `apps/server/package.json`, `oxlintrc.json` | Node build/process and Oxlint patterns, with current compatible versions. |

Do not copy Karardex's large app/auth configuration, billing/OCR/MCP/worker machinery, environment-file discovery, private deployment settings, or icon restrictions. Its `packages/api` depends on server and DB packages; use a cleaner contract boundary here. Its Next-specific development API fallback is also unsuitable for our static frontend.

## 3. Recommended structure and dependency direction

Use a small npm workspace arrangement; retain the current frontend at repository root to avoid a large unrelated move and keep the existing lockfile/package-manager workflow.

```text
src/                         # existing Next static site
  lib/api.ts                 # sole application RPC transport/client
  lib/auth-client.ts         # browser auth SDK facade, no server code
content/                     # local MDX, build-time only
public/
server/                      # independently built/deployed workspace
  src/app.ts                 # Hono composition, testable without listening
  src/main.ts                # Node listener + graceful shutdown
  src/env.ts
  src/auth.ts
  src/rpc/{context,router}.ts
  src/services/              # comments, votes, views, optional notifications
  src/db/{client,schema}.ts
  drizzle/                   # reviewed SQL and migration metadata
  package.json
  tsconfig.json
packages/contracts/          # separate, browser-safe workspace
  src/index.ts               # oRPC contracts + validation + public DTOs
  package.json
  tsconfig.json
scripts/                     # slug manifest, boundary/export checks
```

Dependency direction: `web -> contracts <- server`; server owns Drizzle, `pg`, auth server and secrets. Contracts never import Next, Hono context, Drizzle, generated ORM types, filesystem content or environment values. Export the client type independently of server implementation. Validate input/output on the server; a TypeScript type alone is not validation.

Use explicit workspace exports/build order and package-specific TS configs. The existing root `**/*.ts` include must not sweep the backend into the Next TS project. Next may transpile the small contract workspace, or consume its built output; choose one and test a clean install. No runtime import of server router just to infer types.

`src/lib/api.ts` owns URL resolution, credentialed fetch, abort/timeout behavior and typed error handling. Do not access `window` at module initialization or make API calls during prerendering. UI effects/hooks call `api.comments.list(...)`, etc.; no component-specific fetch URLs or duplicated DTO declarations. Keep SDK-managed OAuth/session interactions behind `auth-client.ts`, rather than forcing the OAuth protocol through oRPC.

Separate `build:web`, `build:server`, `typecheck`, `lint`, unit/integration and static smoke commands. The web build must succeed with no database connection, auth secrets or running API. Remove Prisma generation from web build/postinstall after its final consumer is gone. Keep server-only dependencies out of frontend production dependency ownership and emitted assets; workspace install independence is also verified.

## 4. API, auth and hosting contracts

### RPC procedures

| Procedure | Access | Required behavior |
| --- | --- | --- |
| `comments.list({postSlug,limit,cursor})` | Public; optionally personalized | Bounded pagination, deterministic `createdAt DESC, id DESC`, score and own vote only. |
| `comments.create({postSlug,text})` | Session | Trim/validate text; 10 comments per rolling 24 hours, enforced atomically. |
| `votes.toggle({commentId,liked})` | Session | Preserve current toggle behavior; serialize concurrent operations per user/comment. |
| `views.get({slugs})` | Public | Bounded known-slug list; approximate counts. |
| `views.increment({slug})` | Public | Known slug only, atomic increment and abuse limits. |
| `visits.notify(payload)` | Public, if retained | Bounded input, restricted origins, rate limiting, optional Telegram delivery, no UI dependency. |

Use ISO-8601 UTC date strings in public DTOs and adapt the comments UI's current `Date.toISOString()` assumption. Define explicit typed errors (validation, unauthorized, not found, quota/rate limit, unavailable) instead of leaking SQL/provider errors or duplicating action result wrappers. Keep emails, session/token data and other users' vote rows out of public outputs.

Generate a **slug-only manifest** from the existing canonical content loader for the API artifact. No article bodies or Next dependency on the server. Validate views against it; tighten comment slug validation to known writings as well, after inventorying legacy rows. Ship the compatible API manifest before publishing new content; keep old valid slugs during content removals/rolling deploys.

Use small bounded 60-second process-local caching for public view counts if useful; document that it is approximate and resets per process. No shared cache for personalized comment/session responses. Do not automatically retry non-idempotent view increments or vote toggles.

### Auth choice: Better Auth, approved

Use Better Auth on Hono with the Drizzle adapter and GitHub/Google providers, consistent with Karardex. It removes the NextAuth/Prisma dependency rather than trying to keep NextAuth v4 running inside Hono. This is **not a drop-in adapter swap**.

Owner-approved behavior: preserve users and provider account associations, but require users to sign in again once. Existing comments/votes remain attached to the same user IDs. Do not auto-link identities purely by matching email or create duplicate users on first OAuth login.

Rollback must also preserve identities created or provider accounts linked **after** cutover. Retaining only the old tables is insufficient. Prefer a reviewed, idempotent identity reconciliation procedure during a short rollback write/auth pause, rather than permanent dual auth writers. It must map new users and provider links into legacy-compatible associations, preserve IDs/ownership, reject conflicts without partial changes, and complete before legacy sign-in resumes. Exact implementation and a successful fixture rehearsal are production-approval gates.

Rehearse an additive schema/backfill plan on local fixtures first. Existing nullable name/email, timestamp `emailVerified` versus Better Auth's boolean, provider account mapping, token expiry units, required auth timestamps and token storage all need explicit mapping. Preserve legacy columns/tables through rollback; use mapped/new auth fields or tables where appropriate, rather than altering incompatible columns in place. Unmappable/ambiguous accounts block automatic migration and require a resolution policy; never silently invent verified email data. Do not assume old OAuth token encodings or session cookies are reusable.

OAuth callbacks and cookie/public URL settings belong to the API host. Auth handlers live on Hono at `/auth/*` (configure the SDK base path), not Next routes. Auth library handles its protocol/CSRF mechanics; every protected oRPC procedure still independently authorizes its caller. Propagate session-refresh `Set-Cookie` headers correctly through the RPC handler if needed.

If uninterrupted legacy sessions are mandatory, stop and design a separate Auth.js/core compatibility path; do not improvise a partial migration or keep a hidden Next API deployment.

### Hosting choice: API subdomain on Retrophoto VPS, approved

```text
ybaha.com          -> Cloudflare Pages (static)
api.ybaha.com      -> Cloudflare-proxied VPS service
                         /rpc/*
                         /auth/*
                         /healthz, /readyz
                              -> existing PostgreSQL
```

A separate API origin best matches the requested decoupling and requires no Pages Function/Worker proxy. Use `credentials: include`, explicit CORS origin allowlists, auth trusted origins and host-only Secure/HttpOnly cookies. Production frontend/API are cross-origin but same-site; do not widen cookie Domain to the whole parent domain without a reason. CORS is not CSRF protection: validate browser mutation origins/content types and enforce the selected auth/RPC CSRF protections; never mutate via GET.

Local development uses explicit web/API localhost ports and origins; no Next rewrite/proxy. Build-time public API URL is the only backend configuration the static browser bundle needs. Never put secrets into `NEXT_PUBLIC_*`.

`*.pages.dev` previews are cross-site to the production API and may hit third-party cookie restrictions. Default previews to public/read-only access without production auth, mutations or visit notifications; permit only explicitly approved origins. For full auth E2E use a stable same-site staging frontend + staging API + disposable/staging DB and separate OAuth configuration. Never allow arbitrary preview deployments to perform production writes.

Set API responses to bypass Cloudflare caching (especially sessions, personalized comments and auth). Preserve multiple `Set-Cookie` headers; test redirects and cookies through the real proxy before cutover. Bound request sizes before parsing; avoid consuming the request body twice before oRPC. Use trusted-proxy IP rules only after identifying the real ingress; do not trust arbitrary `x-forwarded-for`. Rate limits must reflect the actual process count; process-local maps are not durable/distributed guarantees. Use edge limits or a PostgreSQL-backed limiter for exposed abuse-sensitive operations as needed, without adding Redis by default.

Before deployment, verify the current portfolio production host/database target, backup/restore arrangements and permitted ingress changes. Use a separately named PM2 API service and nginx vhost, leaving unrelated services untouched. Pool limits, loopback binding, reverse proxy, TLS, restart policy, redacted logs and graceful SIGTERM/pool shutdown are part of the deployment deliverable. Do not reuse a port merely because old Karardex docs called it free.

Read-only VPS discovery completed 2026-10-16:

- Connected over Tailscale to the Retrophoto Ubuntu host, pinning its existing documented SSH host key. No server changes, database connections, restarts or secrets inspection were performed.
- Ubuntu **20.04.6 LTS**; nginx and PM2 **5.4.3** are active. No portfolio backend found in the scoped process/directory/vhost checks; plan a new independent service, not a Karardex deployment or a change to `bin-api`.
- Default Node is **20.18.0**, below this repository's >=22.13 requirement. Compatible Node **22.22.0** and **22.23.1** are already installed. Pin the new process to an explicit compatible interpreter; **do not switch the shared default runtime or restart other apps**. Node 23 is also present but is not the supported target.
- PostgreSQL **12.22** is active, including the shared main cluster and an unrelated isolated app cluster. No databases/tables were queried. PostgreSQL 12 is EOL; upgrading it or provisioning a separate modern cluster is a separately approved infrastructure task. The API rollout must either test against the retained database major or target an explicitly approved newer cluster—passing only newer local PostgreSQL tests is insufficient.
- Main disk is **84% used**, about **5.9 GB available**; available RAM was about **1.1 GB**, with swap in use. Build artifacts in CI/local, keep pool/process limits modest, and verify headroom before deployment. Do not treat this snapshot as a capacity guarantee.
- Some shared services, including the main PostgreSQL listener, bind wildcard addresses; that alone does not establish external reachability. Verify firewall/Cloudflare-origin restrictions before exposing the new API; no unrelated firewall changes are included.
- Public/private infrastructure addresses and SSH details are intentionally omitted from this repository plan. Access instructions remain local. Backups, DNS/Cloudflare account settings and the portfolio's actual production DB location remain unverified.

## 5. Drizzle migration safety

Separate **ORM replacement** from **auth schema change**.

1. Establish fixtures from committed baseline SQL in a disposable loopback PostgreSQL instance. No production connection is needed for development.
2. Explicitly map existing quoted table/column/constraint names, text IDs, `TIMESTAMP(3)` semantics, defaults, indexes and cascades. Do not introduce UUID IDs or snake_case renames. Generate new IDs in application code; Prisma CUID defaults are not database defaults. Set `updatedAt` on inserts/updates: the current DB has neither a default nor an update trigger for it.
3. Port business operations to Drizzle without DDL changes. Preserve the comment transaction advisory lock, count and insert on one transaction/connection. Add a transaction advisory lock per user/comment for vote toggles: the current unique index alone does not prevent races. Test genuine concurrent calls; current tests cover only sequential toggles.
4. Establish a reviewed Drizzle baseline and **one active migration owner**. Archive/retain Prisma SQL/history as provenance, exclude `_prisma_migrations` from application schema management, and remove Prisma runtime only after parity passes. Fresh DB bootstrap and already-existing DB adoption are distinct paths: never execute the initial CREATE TABLE migration on an existing deployment.
5. Rehearse the exact migration-ledger adoption/checksum procedure on an existing-schema fixture and a fresh DB, then prove a subsequent additive migration works on both. Adoption may write migration metadata and is not read-only; production adoption needs approval and backup. Require schema-match preconditions and explicit target guards.
6. Only then generate/review/rehearse the separate auth expansion/backfill SQL and identity checks. Keep old schema readable for rollback; postpone destructive cleanup until after the retention window.

No `prisma db push`, `drizzle-kit push`, automatic production migration on build/start, unreviewed introspection output, or destructive down-migration. Real data verification requires an owner-approved sanitized copy or controlled production procedure. Never embed a dump in the repository.

**Stable-tooling trap:** Drizzle's current docs demonstrate RC functionality. Stable `drizzle-kit@0.31.11`'s CLI does not expose the documented `pull --init` flag (verified in its published artifact). Do not write a plan/runbook that assumes it exists, and do not upgrade to RC just to obtain it. The migration-ledger procedure must be validated with the chosen stable version before production approval.

## 6. Oxlint adoption

Make this a separate, reviewable checkpoint rather than hiding lint churn in service extraction.

- Convert the actual `eslint.config.mjs`, including Next core-web-vitals rules, test overrides and generated-output ignores, into explicit Oxlint configuration. Native `nextjs`, `react`, TypeScript and accessibility plugins are available, but rule-by-rule equivalence must be checked.
- Target Oxlint-only if all currently enabled rules can be preserved. If a material rule is missing, temporarily retain only that ESLint check with overlap disabled; document the gap rather than dropping coverage.
- Add import restrictions plus a graph/bundle check for frontend/contracts -> server/DB/auth-server dependencies. A literal-import rule alone does not prove transitive isolation.
- Add high-signal React/hooks and TypeScript checks deliberately; fix actual failures without broad disables or turning this into a formatting rewrite. Keep existing formatting tooling; Oxfmt is out of scope.
- Keep standalone TypeScript checks. Optional `oxlint-tsgolint` adoption requires a passing TS7/project-config check, not an assumed replacement for typecheck.
- Remove `eslint`, `eslint-config-next`, the TS6 compatibility package/override and related config only after proving their remaining consumers are gone and coverage is preserved.

Registry snapshot, 2026-10-16 (revalidate compatible stable versions before installing): oRPC server/client/contract `1.15.7` together; Hono `4.13.13`; `@hono/node-server` `2.1.5`; Drizzle ORM `0.45.4` + Kit `0.31.11`; Better Auth `1.7.10`; Zod `4.6.7`; Oxlint `1.88.0`. Preserve supported Node >=22.13 initially and verify exact tool requirements. oRPC docs currently show v2-beta examples: use APIs/examples from the selected stable release, not an accidental `@beta` install. No package installation was performed during planning.

## 7. Implementation checkpoints and acceptance

### A — Baseline, approved decisions, workspace and lint

**Status (2026-10-16, local worktree):** Complete. Baseline at `a6ed7a5` before changes: `npm ci` requires synthetic `DATABASE_URL` for `prisma generate`; `npx tsc --noEmit` failed on missing `*.webp` module types (Next build still passed); `npm run lint` (ESLint), `npm test`, `npm run test:integration`, and `npm run build` passed.

**After checkpoint A (synthetic env, logs under `/tmp/checkpoint-a-*`):** `npm ci`, `npm run typecheck` (web + `@baha/contracts` + `@baha/server`), `npm run lint` (Oxlint Next parity + boundary script), `npm test` (65 tests incl. contracts/boundary), `npm run test:integration`, and `npm run build` pass. Added npm workspaces (`packages/contracts`, `server`), browser-safe `@baha/contracts` oRPC 1.15.7 + Zod 4 contracts (five domains), server dependency skeleton, Oxlint replacing ESLint, import boundary checks, `types/static-assets.d.ts` for webp imports. Frontend behavior unchanged; no static export yet.

Record current test/build results, route/content inventory, schema fixtures and dependency audit. Add workspace/package TS boundaries, contracts skeleton, independent scripts and Oxlint parity. No infrastructure changes. Frontend stays behaviorally unchanged; existing gates pass. Parent reviews actual diff before the next writer checkpoint.

### B — Standalone API + Drizzle business parity

**Status (2026-10-16, local worktree):** Initial implementation and first repair were rejected after review and hung tests. Main session stabilized the code: request-scoped session memoization (with concurrent-user/anonymous isolation regression), official oRPC serialization and Hono body limiting, real chunked-body test, guaranteed listener cleanup, and 60-second test-runner deadlines. Removed handwritten RPC envelopes, duplicate migration verification modules and ambient declaration workarounds. Production startup always refuses until real auth is wired; no environment flag can enable fake auth.

**Verified after stabilization:** `npm run typecheck`, `npm run lint` (11 existing warnings), `npm test` (65 pass), `npm run test:integration` (30 pass), and `npm run test:server` (26 pass in the latest run; exits normally in ~27 seconds). Logs: `/tmp/baha-recovery-*`. Baseline tests reject changed defaults, FK removal, timestamp precision drift, missing/partial unique indexes and empty DBs without writing metadata; adopt only 0000, then official migrator applies 0001. Compiled artifact startup from an unrelated directory is tested. Fresh `build:web` passes. Independent review accepted the stabilized local checkpoint with two notes; both are fixed and tested: trailing-slash visit routes keep the 8KB cap, and baseline adoption waits for concurrent index DDL then rechecks the committed schema. Checkpoint B is accepted locally, not production-ready; Better Auth and frontend export are still pending.

Baseline adoption is an explicitly manual, bounded operation for these seven tables, not a supported Kit `pull --init` feature or general schema-repair engine. It remains loopback-only; any production adoption requires a separate approved runbook. One TypeScript module owns verification/adoption, and the CLI uses `tsx`; no duplicate JS/TS implementation or hand-maintained declarations.

Implement testable Hono app and Node entry, contracts/DTOs, Drizzle mappings, comment/vote/view services, slug manifest, typed errors, health/config/shutdown and abuse limits. Keep old Next paths temporarily while validating local parity; do not duplicate business policy long term. Prove migration baseline on fresh/existing fixtures. Auth-dependent procedures can use test-injected context in the test harness, never a public bypass endpoint or production auth override.

Gate: service and real HTTP oRPC tests cover exact schema/defaults/IDs, privacy, bounded cursor pagination, validation, unauthorized mutations, missing targets, atomic view upserts, concurrent near-limit quota calls and concurrent same/opposite vote toggles. Define toggle linearization via the transaction lock; clients avoid automatic toggle retries.

### C — Approved auth migration

**Status (2026-10-16, local worktree):** **C1 (data)** — additive `server/drizzle/0002_better_auth.sql` + journal; Drizzle mappings and `reconcileLegacyAccountsFromAuth`; `test/integration/auth-data.test.mjs`. **C2 (runtime, local)** — `server/src/auth.ts` (`better-auth@1.7.10` + `better-auth/adapters/drizzle`), `parseAuthConfig` / `validateServerStartup`, real `/auth/*` mount + SDK `getSession` bridge with `returnHeaders` Set-Cookie forwarding into oRPC `resHeaders`; `test/integration/auth-runtime.test.mjs` (disposable PG, signed session fixtures via `better-auth/cookies` + `better-call`, no live OAuth). Env names documented in `server/.env.example` and `server/README.md`. **Still pending:** authorized staging OAuth smoke for full GitHub/Google callback flows and production schema/deployment. Static frontend export (**D**) is now complete; see final validation above. No production schema changes.

Implement Hono auth handler/client, cookie/origin/CSRF policy and additive SQL/backfill. Preserve IDs/provider associations, with the approved one-time logout. Test new and returning GitHub/Google identities, session expiry/sign-out, account collisions and null legacy fields. Mandatory rollback fixture: migrate existing accounts, create a new OAuth user, link an additional provider using controlled test flows, write comments/votes, run the reconciliation procedure, then authenticate through the legacy adapter and verify identical IDs and ownership. Also test failed/conflicting reconciliation is safe. Local tests use controlled provider responses/synthetic sessions; real OAuth smoke requires authorized staging configuration. No production schema edits in this checkpoint.

### D — Switch browser clients and produce static export

**Status (2026-10-17, local worktree):** Implemented. Added `src/lib/api.ts` + `src/lib/auth-client.ts` (oRPC + Better Auth browser SDK), migrated comments/auth/views/visits UI off Server Actions/NextAuth, enabled `output: 'export'` with `dynamicParams = false` on detail routes, removed `src/app/api` and Prisma from the web build/postinstall, moved legacy Prisma schema to `test/fixtures/legacy-prisma` with `generate:legacy-test`, and rehomed visit/Telegram/comment policy tests to server HTTP/unit tests. Verified: `npm run typecheck`, `npm run lint`, `npm test` (58), `npm run test:integration` (50), `npm run test:server` (26), and `env -u DATABASE_URL … npm run build:web` → `out/` (6 index routes + 3 writings + 1 vault + 404/robots/sitemap). **Gaps:** staging OAuth smoke, Cloudflare Pages deploy, browser deep-link/hydration diff vs baseline capture, production cutover (**E**).

- Add `src/lib/api.ts` and `auth-client.ts`; migrate `comments.tsx`, writing `client-comments.tsx`, `writing-list.tsx`, `auth/login-dialog.tsx` and `main-layout.tsx` off Server Actions/NextAuth React.
- Preserve drafts and expanded pagination on errors, guard against stale post responses, show retryable comments failures, and distinguish view-count unavailable from zero. Refetch personalized votes after session changes/sign-out. Session loading/unavailable must not masquerade as a successful logged-out response.
- View increments remain approximate; prevent obvious duplicate effects and do not invent fingerprinting or exactly-once analytics.
- Move `page.client.tsx` notifications to the standalone service if retained; keep preview suppression and failures invisible to visitors.
- Remove `src/app/api/`, the five Server Action files, obsolete `lib/auth*`, `lib/prisma.ts` and generated Prisma dependencies once unused. Keep content-backed `queries/writings.ts`, optionally rename later; it is not a Server Action.
- Enable `output: 'export'`, static-compatible images (global `images.unoptimized: true` initially), and explicit route fallback behavior (`dynamicParams = false` for enumerated details). Preserve URL canonicals and verify Cloudflare's actual extension/trailing-slash behavior rather than adding an SPA catch-all redirect.
- Remove root cookie reads and obsolete request-cache settings. Apply dark/accent preferences client-side with tested first-paint/hydration behavior; use CSS theme variables for toasts.
- Explicitly statically emit sitemap/robots as required by Next 16; verify the exported files, not only TS compilation. Keep MDX compilation/server-only helpers in the build graph only. Font download remains build-time network access, not a runtime API dependency.
- Replace `next start` in frontend deployment/preview instructions with static serving; no Next rewrites, middleware, ISR, runtime optimizer or request cookies.

Gate: clean web build with backend off and DB/auth env unset produces `out/`; export includes every real content route and SEO file. Static-only browser run verifies direct deep links/reload/404, Next client navigation/RSC assets, search/filter/log hashes, theme persistence, images, desktop/mobile and no hydration/console errors. API-offline pages remain readable and interactive features fail gracefully. Check import graph and output for server modules/secrets and assert no Next API routes/actions exist. Rehome endpoint/source-path regression tests to server behavior tests; do not delete safety coverage just because files moved.

### E — Deployment rehearsal and explicit production cutover

Build immutable API artifact + slug manifest; deploy separately to approved staging. Exercise credentialed requests, CORS/CSRF, OAuth, CDN cache bypass, cookies/redirects and rate-limit proxy identity there. Run frontend static build/preview with the staging API. CI must separately run web/contract/server typechecks, lint, unit tests, disposable-DB integrations, API artifact build and static export/browser checks; no production secrets or schema migrations.

Before production: approved infrastructure discovery, tested DB backup/restore, reviewed additive migrations/baseline, account-count/identity checks, documented callback/DNS/public URL changes and rollback artifact/config. Deploy compatible API before frontend (including new slug manifest), apply approved migrations as a separate controlled step, validate service readiness, then switch Pages/custom domain and OAuth callbacks. Avoid dual Next/new API writers during final auth cutover; a short write-maintenance window is safer than pretending migration is zero-downtime. Maintain oRPC procedure compatibility across subsequent static-client releases.

The initial Next Server Action -> oRPC transition is different: an already-open legacy tab cannot call the new transport and will not become compatible merely because procedure names match. Plan an explicit reload/expiry window and a preparatory legacy-client release that retains drafts in guarded session storage and prompts reload on stale-action/build errors. Rehearse open tabs, expired actions, stale navigation/assets and reload/draft recovery. Tabs that never loaded the preparatory release may fail and cannot be promised unsaved-draft recovery; communicate reload-before-writing. No permanent Next transport shim or runtime is part of the final design.

Rollback: pause auth and writes, reconcile every post-cutover new identity/provider link using the rehearsed, idempotent procedure, and verify IDs/comment/vote ownership before restoring legacy sign-in and prior frontend/API routing/artifacts. Retaining legacy mappings alone is not sufficient. Do not drop new tables/columns or delete newly written comments/votes; legacy schema must accept any approved additive changes. New sessions may require re-login. Do not restore a backup over newer user writes as an automatic rollback. Remove legacy schema/history only in a separately approved later cleanup.

## 8. Owner decisions and review disposition

Owner confirmed on 2026-10-16:

1. **Auth:** Better Auth and one-time re-login approved; preserve all user/provider identities, comments and votes.
2. **Hosting/origin:** `api.ybaha.com` on the Retrophoto VPS approved; authorized read-only Tailscale/SSH discovery completed using a verified host key. No production writes, package installs on the VPS, restarts, migrations, DNS changes or deployments authorized by this discovery approval.
3. **Visit notifications: KEEP.** Preserve current optional Telegram notifications and non-blocking behavior; retain server-only secrets and preview suppression. No silent removal or reduction of visitor data as part of this refactor.

Defaults: retain root frontend/npm, local content generation, existing PostgreSQL, serialized vote toggles, approximate 60-second view caching, ISO DTO dates, and public/read-only Pages previews. Application implementation/package-install approval and production change approval remain separate from the read-only discovery scope.

Independent review agreed with the architecture but identified a production-blocking gap in rollback for post-cutover new identities/provider links and a stale Server Action client compatibility gap. Both are now explicit design/test gates in §§4 and 7C/E. Production rollback is not considered ready until the identity-lifecycle fixture and reconciliation procedure pass.

## Sources

- [Next static exports](https://nextjs.org/docs/app/guides/static-exports)
- [Cloudflare Pages static Next guide](https://developers.cloudflare.com/pages/framework-guides/nextjs/deploy-a-static-nextjs-site/) (verified via Cloudflare's public documentation repository when the docs host returned 403)
- [oRPC Hono adapter](https://orpc.dev/docs/adapters/hono), [contract-first](https://orpc.dev/docs/contract-first/define-contract), [Better Auth integration](https://orpc.dev/docs/integrations/better-auth) — verify against stable 1.x before implementation
- [Better Auth Hono](https://www.better-auth.com/docs/integrations/hono), [Auth.js migration](https://www.better-auth.com/docs/guides/next-auth-migration-guide)
- [Drizzle existing PostgreSQL](https://orm.drizzle.team/docs/get-started/postgresql-existing), [introspection/baselining](https://orm.drizzle.team/docs/drizzle-kit-pull) — docs currently contain features absent from the stable Kit release
- [Oxlint plugins](https://oxc.rs/docs/guide/usage/linter/plugins.html), [ESLint migration](https://oxc.rs/docs/guide/usage/linter/migrate-from-eslint.html)
