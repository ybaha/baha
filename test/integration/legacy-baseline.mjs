import { readFileSync } from "node:fs";
import { join } from "node:path";
import pgDriver from "pg";

export function legacyInitSqlPath(repoRoot) {
  return join(repoRoot, "prisma/migrations/0_init/migration.sql");
}

export async function applyLegacyInitSql(databaseUrl, repoRoot) {
  const sql = readFileSync(legacyInitSqlPath(repoRoot), "utf8");
  const pool = new pgDriver.Pool({ connectionString: databaseUrl });
  try {
    await pool.query(sql);
  } finally {
    await pool.end();
  }
}
