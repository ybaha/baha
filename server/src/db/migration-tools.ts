#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

type Checksum = { tag: string; when: number; hash: string };
type LedgerRow = { hash: string; created_at: string | number };

const serverRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const drizzleRoot = join(serverRoot, "drizzle");
const FINGERPRINT_SQL = readFileSync(
  join(serverRoot, "scripts/schema-fingerprint.sql"),
  "utf8",
);
const BASELINE_FINGERPRINT_PATH = join(
  drizzleRoot,
  "baseline-schema-fingerprint.json",
);

function assertLoopback(url: string) {
  const host = new URL(url).hostname;
  if (host !== "127.0.0.1" && host !== "localhost") {
    throw new Error(`Refusing non-loopback DATABASE_URL host "${host}"`);
  }
}

function journalEntries() {
  const journal = JSON.parse(
    readFileSync(join(drizzleRoot, "meta/_journal.json"), "utf8"),
  );
  return journal.entries as Array<{ tag: string; when: number }>;
}

export function migrationChecksums(): Checksum[] {
  const entries = journalEntries();
  const out = [];
  for (const entry of entries) {
    const sql = readFileSync(join(drizzleRoot, `${entry.tag}.sql`), "utf8");
    out.push({
      tag: entry.tag,
      when: entry.when,
      hash: createHash("sha256").update(sql).digest("hex"),
    });
  }
  return out;
}

export function loadBaselineFingerprint() {
  const raw = readFileSync(BASELINE_FINGERPRINT_PATH, "utf8");
  const parsed = JSON.parse(raw);
  if (!parsed?.tables || !Array.isArray(parsed.tables)) {
    throw new Error("Invalid baseline schema fingerprint fixture");
  }
  return parsed;
}

export function fingerprintsMatch(actual: unknown, expected: unknown): boolean {
  return JSON.stringify(actual) === JSON.stringify(expected);
}

export async function readSchemaFingerprint(databaseUrl: string) {
  assertLoopback(databaseUrl);
  const pool = new pg.Pool({ connectionString: databaseUrl });
  try {
    const { rows } = await pool.query(FINGERPRINT_SQL);
    return rows[0]?.fingerprint;
  } finally {
    await pool.end();
  }
}

export async function assertBaselineSchema(databaseUrl: string) {
  const actual = await readSchemaFingerprint(databaseUrl);
  const expected = loadBaselineFingerprint();
  if (!fingerprintsMatch(actual, expected)) {
    throw new Error(
      "Database schema does not match committed baseline fingerprint (pre-0001)",
    );
  }
  return actual;
}

async function readLedger(pool: pg.Pool) {
  const { rows } = await pool.query(
    "SELECT id, hash, created_at FROM drizzle.__drizzle_migrations ORDER BY created_at ASC, id ASC",
  );
  return rows;
}

export function verifyLedgerRowsAgainstChecksums(rows: LedgerRow[], checksums: Checksum[]) {
  if (rows.length > checksums.length) {
    throw new Error("Drizzle migration ledger has unknown extra entries");
  }
  for (let i = 0; i < rows.length; i += 1) {
    const expected = checksums[i];
    const row = rows[i];
    if (row.hash !== expected.hash) {
      throw new Error(
        `Drizzle ledger hash mismatch for migration index ${i} (${expected.tag})`,
      );
    }
    if (String(row.created_at) !== String(expected.when)) {
      throw new Error(
        `Drizzle ledger timestamp mismatch for migration index ${i} (${expected.tag})`,
      );
    }
  }
}

export async function verifyMigrationLedger(databaseUrl: string) {
  assertLoopback(databaseUrl);
  const checksums = migrationChecksums();
  const pool = new pg.Pool({ connectionString: databaseUrl });
  try {
    const exists = await pool.query(
      "SELECT to_regclass('drizzle.__drizzle_migrations') AS reg",
    );
    if (!exists.rows[0]?.reg) {
      return;
    }
    const rows = await readLedger(pool);
    verifyLedgerRowsAgainstChecksums(rows, checksums);
  } finally {
    await pool.end();
  }
}

// One-time manual adoption of this exact baseline; not a general migration engine.
// Production use remains blocked by the loopback guard pending a separately approved runbook.
export async function adoptDrizzleBaseline(databaseUrl: string) {
  assertLoopback(databaseUrl);
  await assertBaselineSchema(databaseUrl);

  const checksums = migrationChecksums();
  const baseline = checksums[0];
  if (!baseline) {
    throw new Error("No baseline migration entry in journal");
  }

  const pool = new pg.Pool({ connectionString: databaseUrl });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "SELECT pg_advisory_xact_lock(hashtext('drizzle-baseline-adopt'))",
    );

    await client.query("CREATE SCHEMA IF NOT EXISTS drizzle");
    await client.query(`CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    )`);

    const ledger = await client.query(
      "SELECT id, hash, created_at FROM drizzle.__drizzle_migrations ORDER BY created_at ASC, id ASC",
    );
    if (ledger.rows.length > 0) {
      verifyLedgerRowsAgainstChecksums(ledger.rows, checksums);
      if (ledger.rows.length >= checksums.length) {
        await client.query("COMMIT");
        return { adopted: false, reason: "ledger-complete" };
      }
      if (ledger.rows.length !== 1) {
        throw new Error(
          "Nonempty drizzle ledger is in an unexpected partial state; refusing adopt",
        );
      }
      await client.query("COMMIT");
      return { adopted: false, reason: "ledger-partial" };
    }

    await client.query('LOCK TABLE "Account", "Session", "User", "VerificationToken", "Comment", "Vote", "PostView" IN SHARE ROW EXCLUSIVE MODE');
    const recheck = await client.query(FINGERPRINT_SQL);
    const expected = loadBaselineFingerprint();
    if (!fingerprintsMatch(recheck.rows[0]?.fingerprint, expected)) {
      throw new Error("Baseline schema changed during adopt transaction");
    }

    await client.query(
      "INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ($1, $2)",
      [baseline.hash, baseline.when],
    );
    await client.query("COMMIT");
    return { adopted: true };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}
