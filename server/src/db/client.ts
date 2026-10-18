import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";

import { schema, type DatabaseSchema } from "./schema.js";

export type AppDatabase = NodePgDatabase<DatabaseSchema>;

export type DatabaseBundle = {
  pool: pg.Pool;
  db: AppDatabase;
  ping: () => Promise<boolean>;
  shutdown: () => Promise<void>;
};

export type CreateDatabaseOptions = {
  connectionString: string;
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
};

export function createDatabase(options: CreateDatabaseOptions): DatabaseBundle {
  const pool = new pg.Pool({
    connectionString: options.connectionString,
    // Prisma's existing timestamp-without-time-zone data is stored as UTC.
    options: "-c timezone=UTC",
    max: options.max ?? 10,
    idleTimeoutMillis: options.idleTimeoutMillis ?? 30_000,
    connectionTimeoutMillis: options.connectionTimeoutMillis ?? 5_000,
    // Bound server work as well as client waiting; a stalled history write must release its slot.
    statement_timeout: 5_000,
    query_timeout: 6_000,
  });
  const db = drizzle(pool, { schema });

  return {
    pool,
    db,
    async ping() {
      try {
        await pool.query("SELECT 1");
        return true;
      } catch {
        return false;
      }
    },
    async shutdown() {
      await pool.end();
    },
  };
}
