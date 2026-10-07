# baha

Personal site: writings, vault snippets, a logs timeline and a comments system.
Next.js 16 (App Router, Turbopack), React 19, Tailwind 3, MDX content in `content/`,
PostgreSQL via Prisma 7, NextAuth (GitHub/Google).

## Requirements

- Node.js `>=22.13` (see `engines` in `package.json`)
- PostgreSQL for comments, votes, views and sign-in (the public pages render without it)

## Setup

```bash
npm ci
cp .env.example .env   # then fill in values; .env is git-ignored
npm run dev
```

`npm ci` runs `prisma generate` (output goes to `src/generated/prisma`, git-ignored).

### Environment variables

Names only; see `.env.example`.

| Name | Used for |
| --- | --- |
| `DATABASE_URL` | Prisma runtime and CLI |
| `NEXTAUTH_URL`, `NEXTAUTH_SECRET` | NextAuth |
| `NEXT_PUBLIC_GITHUB_ID`, `GITHUB_SECRET` | GitHub sign-in |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google sign-in |
| `SITE_URL` | Absolute URLs in `sitemap.xml` / `robots.txt` (optional) |

## Content

Content lives in `content/{writings,snippets,logs}` as `.mdx` with frontmatter.
It is loaded at build/request time by `src/lib/content` and compiled with
`next-mdx-remote`; there is no separate content build step. Slugs are file
basenames. A log's optional `icon` must be listed in `src/components/icons.tsx`
(a test enforces this).

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | `prisma generate` + `next build` (Turbopack) |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint (flat config) |
| `npm test` | Unit/regression tests (no database) |
| `npm run test:integration` | Contract tests against a **disposable local** PostgreSQL |

Both dev and build use Next's default bundler (Turbopack). `next/font/google` (Cormorant)
is downloaded at build time, so the first build needs network access.

Integration tests need `initdb`, `pg_ctl` and `createdb` on `PATH`. They create a
cluster under `/tmp` on a free loopback port, point `DATABASE_URL` at it for the
test process, and remove it when done.

## Database

The build only runs `prisma generate`; it never changes a schema. Migrations live in
`prisma/migrations` (`0_init` is the baseline of the current schema and is already
marked as applied in production). To change the schema:

1. Edit `prisma/schema.prisma` and create a migration against a **local** database
   (`prisma migrate dev --name <change>`).
2. Review the SQL, commit it, then run `prisma migrate deploy` against production.

Back up first (`pg_dump`). Never run `prisma db push` against a database you care
about. See `prisma/README.md`.

## Deploy

Run `npm ci && npm run build && npm start` with the environment above. CI
(`.github/workflows/ci.yml`) runs typecheck, lint, tests and a build using
synthetic values only.

## Security notes

- Comment text is validated server-side (length, slug pattern) and a user may post
  at most 10 comments per rolling 24 hours (enforced in one transaction with a
  per-user advisory lock).
- Reading comments is public; posting and voting require a session. Responses never
  include emails or other users' vote rows.
