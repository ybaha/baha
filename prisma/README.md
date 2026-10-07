# Database

The application build (`npm run build`) runs `prisma generate` only. It does **not** apply or push schema changes to any database.

Existing deployments must already match `schema.prisma` (or be brought in line via a reviewed, version-controlled migration baseline approved for that environment). Do not use `prisma db push --accept-data-loss` in CI, install hooks, or build scripts.

Apply schema updates deliberately with `prisma migrate deploy` (or your environment’s approved migration process) after migrations have been reviewed.
