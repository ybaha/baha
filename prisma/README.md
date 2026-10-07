# Database

The application build (`npm run build`) runs `prisma generate` only. It does **not** apply or push schema changes to any database.

`migrations/0_init` is the baseline of the schema as of the Prisma 7 upgrade; production already matched it and has it recorded as applied (`prisma migrate resolve --applied 0_init`). A fresh database gets the same schema from `prisma migrate deploy`. Do not use `prisma db push --accept-data-loss` in CI, install hooks, or build scripts.

Apply schema updates deliberately with `prisma migrate deploy` (or your environment’s approved migration process) after migrations have been reviewed.
