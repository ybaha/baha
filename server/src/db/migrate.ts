import { migrate } from "drizzle-orm/node-postgres/migrator";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import type { AppDatabase, DatabaseBundle } from "./client.js";
import { verifyMigrationLedger } from "./migration-tools.js";

const migrationsFolder = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "drizzle",
);

export async function runMigrations(
  db: AppDatabase,
  databaseUrl: string,
): Promise<void> {
  await verifyMigrationLedger(databaseUrl);
  await migrate(db, { migrationsFolder });
}

export async function runMigrationsForBundle(bundle: DatabaseBundle): Promise<void> {
  const databaseUrl = bundle.pool.options.connectionString;
  if (!databaseUrl) {
    throw new Error("Database connection string is required for migrations");
  }
  await runMigrations(bundle.db, databaseUrl);
}
