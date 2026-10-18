# baha

Personal site: [ybaha.com](https://ybaha.com) — writings, vault snippets, a logs timeline and a comments system.
Next.js 16 (App Router) static export, React 19, Tailwind 3, MDX content in `content/`,
and a standalone typed API (`@baha/server`, intended for `api.ybaha.com`) for comments, votes, views and Better Auth. Deployment is a separate step.

## Requirements

- Node.js `>=22.13` (see `engines` in `package.json`)
- The static site builds without PostgreSQL or auth secrets; interactive features call the API at runtime.

## Setup

```bash
npm ci
cp .env.example .env   # optional public URLs for local dev
npm run dev
```

Run the API separately from `server/` when exercising comments, sign-in, or visit notifications locally.

### Environment variables (frontend)

Names only; see `.env.example`. Backend secrets stay in `server/.env.example`.

| Name | Used for |
| --- | --- |
| `SITE_URL` | Metadata, canonical/social URLs, `sitemap.xml` and `robots.txt` (optional; defaults to `https://ybaha.com`) |
| `NEXT_PUBLIC_API_URL` | Browser RPC + Better Auth origin (optional in dev; defaults to `http://localhost:8787`) |
| `NEXT_PUBLIC_SITE_URL` | Client visit-notification host check (optional) |
| `NEXT_PUBLIC_ENABLE_VISIT_NOTIFICATIONS` | Enable visits on additional production-built hosts; localhost and read-only previews always remain excluded |
| `NEXT_PUBLIC_DISABLE_AUTH` | Public/read-only previews on custom hosts (optional; `*.pages.dev` is automatic) |

### Homepage visit notifications

The homepage looks up approximate IP location through `ipapi.co` and calls `visits.notify` on the standalone API.
Telegram delivery, deduplication, and production-only rules are enforced on the server. Alerts include the visited
homepage URL and title, referring page (when shared by the browser), UTC and visitor-local time, approximate location
with a map link, network/ISP, server-observed IP, and inferred browser/device details. The location lookup's IP is labeled
separately if it differs. Browser/device and location details are informational, not verified visitor identities.

Page/referrer URLs omit credentials, query strings, and fragments before transmission; the API sanitizes them again.
Telegram link previews are disabled. No account/session lookup is added. The browser encrypts the entire context with
an ephemeral P-256 ECDH key and AES-256-GCM before calling `visits.notifyEncrypted`; the API decrypts and validates it.
Its public key is fetched at runtime over HTTPS; no private key or shared secret is shipped in the static frontend.
Failures are reported as delivery outcomes and retried up to three times with one stable event ID.

Accepted production visits are saved in the private `Visit` table, with sanitized URLs, server-received timestamps,
separate reported/trusted IPs, and Telegram delivery status. Separate events from the same IP are stored even when their
alerts are throttled. Missing/unavailable storage does not prevent Telegram delivery. Old clients may still use the
legacy plaintext RPC during rollout; their rows are explicitly marked `encrypted=false`.

Notifications remain homepage-only and are skipped on localhost, Cloudflare `*.pages.dev` previews, and unless the
canonical production host (or an explicit flag) is used. **Deploy the API and apply the additive migration before
publishing the encrypted frontend.** See [visit notifications](docs/visit-notifications.md) for rollout, diagnostics,
key management, delivery guarantees, and data-retention guidance.

## Content

Content lives in `content/{writings,snippets,logs}` as `.mdx` with frontmatter.
It is loaded at build time by `src/lib/content` and compiled with
`next-mdx-remote`; there is no separate content build step. Slugs are file
basenames. A log's optional `icon` must be listed in `src/components/icons.tsx`
(a test enforces this).

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Next dev server |
| `npm run build` / `npm run build:web` | Build `@baha/contracts` + static export to `out/` |
| `npm run build:contracts` | Compile `@baha/contracts` to `packages/contracts/dist` |
| `npm run build:server` | Typecheck/build `@baha/server` |
| `npm start` / `npm run preview` | Serve `out/` with `serve` (not `next start`) |
| `npm run typecheck` | `tsc` for web, contracts, and server workspaces |
| `npm run lint` | Oxlint + import/bundle boundary scripts |
| `npm test` | Build contracts, then unit/regression tests (no database) |
| `npm run test:integration` | Legacy Prisma fixture generate + integration tests (disposable PostgreSQL) |
| `npm run generate:legacy-test` | Generate the dev-only legacy Prisma client for adapter rollback tests |
| `npm run test:browser` | Fresh DB-free install/build, then desktop/mobile checks against an owned local API and disposable database |

Fonts are local, including licensed Cormorant assets under `src/assets`; the web build does not fetch fonts or call the API.

## Cloudflare Pages

Use Cloudflare's **Next.js (Static HTML Export)** preset:

- Build command: `npm run build:web`
- Output directory: `out`
- Node: 22.13 or newer; install build/dev dependencies normally
- Production public API: `NEXT_PUBLIC_API_URL=https://api.ybaha.com`
- Site metadata: `SITE_URL=https://ybaha.com` (also the default)

No Next runtime adapter, Pages Function, SPA catch-all rewrite, database URL or auth secret is required.
See the [official static Next.js Pages guide](https://developers.cloudflare.com/pages/framework-guides/nextjs/deploy-a-static-nextjs-site/).

The API is deployed independently; see `server/README.md`. No Cloudflare, VPS, DNS, OAuth or production database changes are performed by these build commands.

## Optional browser checks

The browser test uses an existing Python Playwright installation and cached Chromium; it never installs Python/browser tooling. Set `BROWSER_PYTHON` to the Python executable and `BROWSER_EXECUTABLE` if the compatible browser is not at Playwright's default cached path. It creates only owned temporary services/databases, blocks external browser traffic, and records logs/screenshots under the printed temporary artifact directory.

Integration tests need `initdb`, `pg_ctl` and `createdb` on `PATH`. They create a
cluster under `/tmp` on a free loopback port, point `DATABASE_URL` at it for the
server tests, and remove it when done.

## Database

The static frontend does not embed Prisma. Legacy NextAuth/Prisma adapter rollback tests use
`test/fixtures/legacy-prisma` and `npm run generate:legacy-test`. Production schema history remains in
`prisma/migrations` (`0_init` baseline). Application schema changes are owned by Drizzle in `server/drizzle`.

See `docs/cloudflare-migration-plan.md` for the full migration plan.
