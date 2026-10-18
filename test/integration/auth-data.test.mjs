import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import pgDriver from "pg";

import generatedPrisma from "../../test/generated/prisma/client.ts";
import { createId } from "../../server/src/lib/ids.ts";
import { createDatabase } from "../../server/src/db/client.ts";
import { runMigrations } from "../../server/src/db/migrate.ts";
import { reconcileLegacyAccountsFromAuth } from "../../server/src/db/auth-migration.ts";
import {
  adoptDrizzleBaseline,
  migrationChecksums,
  verifyMigrationLedger,
} from "../../server/scripts/schema-tools.mjs";
import { startLoopbackPostgres } from "./server-pg.mjs";

const { PrismaClient } = generatedPrisma;
const repoRoot = join(fileURLToPath(new URL(".", import.meta.url)), "../..");
const legacyInitSql = readFileSync(
  join(repoRoot, "prisma/migrations/0_init/migration.sql"),
  "utf8",
);

async function applyLegacySchema(databaseUrl) {
  const pool = new pgDriver.Pool({ connectionString: databaseUrl });
  try {
    await pool.query(legacyInitSql);
  } finally {
    await pool.end();
  }
}

async function columnExists(pool, columnName) {
  const { rows } = await pool.query(
    `SELECT 1
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'User'
       AND column_name = $1
     LIMIT 1`,
    [columnName],
  );
  return rows.length > 0;
}

async function migrateEligibleFixture(databaseUrl) {
  const pool = new pgDriver.Pool({ connectionString: databaseUrl });
  const userId = createId();
  const accountId = createId();
  const commentId = createId();
  const voteId = createId();
  const verifiedAt = new Date("2024-06-01T12:00:00.000Z");

  await pool.query(
    `INSERT INTO "User" (id, name, email, "emailVerified", image)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, "Legacy User", "legacy.user@example.com", verifiedAt, null],
  );
  await pool.query(
    `INSERT INTO "Account" (id, "userId", type, provider, "providerAccountId", access_token)
     VALUES ($1, $2, 'oauth', 'github', $3, 'legacy-token')`,
    [accountId, userId, "github-provider-account"],
  );
  await pool.query(
    `INSERT INTO "Comment" (id, text, "createdAt", "updatedAt", "postSlug", "userId")
     VALUES ($1, $2, NOW(), NOW(), $3, $4)`,
    [commentId, "auth migration comment", "mcmaster-speed-secrets", userId],
  );
  await pool.query(
    `INSERT INTO "Vote" (id, value, "createdAt", "updatedAt", "userId", "commentId")
     VALUES ($1, 1, NOW(), NOW(), $2, $3)`,
    [voteId, userId, commentId],
  );
  await pool.end();

  return {
    userId,
    accountId,
    commentId,
    voteId,
    verifiedAt,
    providerAccountId: "github-provider-account",
  };
}

async function adoptAndMigrate(databaseUrl) {
  const adoptResult = await adoptDrizzleBaseline(databaseUrl);
  assert.equal(adoptResult.adopted, true);
  const bundle = createDatabase({ connectionString: databaseUrl });
  try {
    await runMigrations(bundle.db, databaseUrl);
  } finally {
    await bundle.shutdown();
  }
}

describe("auth data migration (C1)", () => {
  it("keeps committed migration ledger entries including additive 0002", () => {
    const checksums = migrationChecksums();
    const tags = checksums.map((entry) => entry.tag);
    assert.deepEqual(tags.slice(0, 2), [
      "0000_initial",
      "0001_comment_post_slug_idx",
    ]);
    assert.equal(tags[2], "0002_better_auth");
    assert.equal(tags[3], "0003_visits");
    assert.equal(checksums.length, 4);
  });

  it("migrates eligible legacy user data and preserves ids without tokens or sessions", async () => {
    const fixture = await startLoopbackPostgres();
    const pool = new pgDriver.Pool({ connectionString: fixture.databaseUrl });
    try {
      await applyLegacySchema(fixture.databaseUrl);
      const seed = await migrateEligibleFixture(fixture.databaseUrl);
      await adoptAndMigrate(fixture.databaseUrl);
      await verifyMigrationLedger(fixture.databaseUrl);

      const user = (
        await pool.query(
          `SELECT id, name, email, "emailVerified", "authEmailVerified"
           FROM "User" WHERE id = $1`,
          [seed.userId],
        )
      ).rows[0];
      assert.equal(user.id, seed.userId);
      assert.equal(user.name, "Legacy User");
      assert.equal(user.email, "legacy.user@example.com");
      assert.equal(new Date(user.emailVerified).toISOString(), seed.verifiedAt.toISOString());
      assert.equal(user.authEmailVerified, true);

      const authAccount = (
        await pool.query(
          `SELECT id, "accountId", "providerId", "userId", "accessToken", "refreshToken"
           FROM auth_account WHERE id = $1`,
          [seed.accountId],
        )
      ).rows[0];
      assert.equal(authAccount.id, seed.accountId);
      assert.equal(authAccount.userId, seed.userId);
      assert.equal(authAccount.providerId, "github");
      assert.equal(authAccount.accountId, seed.providerAccountId);
      assert.equal(authAccount.accessToken, null);
      assert.equal(authAccount.refreshToken, null);

      const sessionCount = await pool.query(`SELECT count(*)::int AS c FROM auth_session`);
      assert.equal(sessionCount.rows[0].c, 0);

      const comment = (
        await pool.query(`SELECT id, "userId" FROM "Comment" WHERE id = $1`, [
          seed.commentId,
        ])
      ).rows[0];
      assert.equal(comment.userId, seed.userId);
    } finally {
      await pool.end();
      await fixture.stop();
    }
  });

  it("fails closed on unexpected existing auth schema without altering it", async () => {
    const fixture = await startLoopbackPostgres();
    const pool = new pgDriver.Pool({ connectionString: fixture.databaseUrl });
    const bundle = createDatabase({ connectionString: fixture.databaseUrl });
    try {
      await applyLegacySchema(fixture.databaseUrl);
      await adoptDrizzleBaseline(fixture.databaseUrl);
      await pool.query("CREATE TABLE auth_account (sentinel text); INSERT INTO auth_account VALUES ('keep-me')");
      await assert.rejects(() => runMigrations(bundle.db, fixture.databaseUrl),
        (error) => error.cause?.code === "42P07" && /auth_account/.test(error.cause.message));
      assert.equal(await columnExists(pool, "authEmailVerified"), false);
      assert.deepEqual((await pool.query('SELECT * FROM auth_account')).rows, [{ sentinel: "keep-me" }]);
    } finally {
      await bundle.shutdown();
      await pool.end();
      await fixture.stop();
    }
  });

  it("blocks preflight failures without partial auth schema changes", async () => {
    const cases = [
      { label: "null name", sql: `INSERT INTO "User" (id, name, email) VALUES ($1, NULL, 'null.name@example.com')` },
      { label: "null email", sql: `INSERT INTO "User" (id, name, email) VALUES ($1, 'Name', NULL)` },
      { label: "blank name", sql: `INSERT INTO "User" (id, name, email) VALUES ($1, '   ', 'blank.name@example.com')` },
      { label: "untrimmed email", sql: `INSERT INTO "User" (id, name, email) VALUES ($1, 'Name', ' trimmed@example.com ')` },
      {
        label: "blank email",
        sql: `INSERT INTO "User" (id, name, email) VALUES ($1, 'Name', '   ')`,
      },
      {
        label: "non-normalized email",
        sql: `INSERT INTO "User" (id, name, email) VALUES ($1, 'Name', 'Mixed@Example.com')`,
      },
      {
        label: "unsupported provider",
        setup: async (pool, userId, accountId) => {
          await pool.query(
            `INSERT INTO "User" (id, name, email) VALUES ($1, 'Good', 'good@example.com')`,
            [userId],
          );
          await pool.query(
            `INSERT INTO "Account" (id, "userId", type, provider, "providerAccountId")
             VALUES ($1, $2, 'oauth', 'telegram', 'tg-1')`,
            [accountId, userId],
          );
        },
      },
    ];

    for (const caseDef of cases) {
      const fixture = await startLoopbackPostgres();
      const pool = new pgDriver.Pool({ connectionString: fixture.databaseUrl });
      try {
        await applyLegacySchema(fixture.databaseUrl);
        const userId = createId();
        const accountId = createId();
        if (caseDef.setup) {
          await caseDef.setup(pool, userId, accountId);
        } else {
          await pool.query(caseDef.sql, [userId]);
        }
        await adoptDrizzleBaseline(fixture.databaseUrl);
        const bundle = createDatabase({ connectionString: fixture.databaseUrl });
        try {
          await assert.rejects(() => runMigrations(bundle.db, fixture.databaseUrl));
        } finally {
          await bundle.shutdown();
        }
        assert.equal(await columnExists(pool, "authEmailVerified"), false);
        const authTables = await pool.query(
          `SELECT to_regclass('public.auth_account') AS auth_account`,
        );
        assert.equal(authTables.rows[0].auth_account, null);
      } finally {
        await pool.end();
        await fixture.stop();
      }
    }
  });

  it("reconciles post-cutover auth links for legacy adapter lookup and stays idempotent", async () => {
    const fixture = await startLoopbackPostgres();
    const pool = new pgDriver.Pool({ connectionString: fixture.databaseUrl });
    const prismaPool = new pgDriver.Pool({ connectionString: fixture.databaseUrl });
    const prisma = new PrismaClient({ adapter: new PrismaPg(prismaPool) });
    const adapter = PrismaAdapter(prisma);
    try {
      await applyLegacySchema(fixture.databaseUrl);
      const seed = await migrateEligibleFixture(fixture.databaseUrl);
      await adoptAndMigrate(fixture.databaseUrl);

      const legacyUserId = seed.userId;
      const legacyGithub = seed.providerAccountId;

      const postCutoverUserId = createId();
      const postCutoverAuthId = createId();
      const googleAccountId = "google-provider-account";
      const now = new Date();

      await pool.query(
        `INSERT INTO "User" (id, name, email, "emailVerified", "authEmailVerified", "authCreatedAt", "authUpdatedAt")
         VALUES ($1, $2, $3, NULL, false, $4, $4)`,
        [postCutoverUserId, "Post Cutover", "post.cutover@example.com", now],
      );
      await pool.query(
        `INSERT INTO auth_account (id, "accountId", "providerId", "userId", "createdAt", "updatedAt")
         VALUES ($1, $2, 'google', $3, $4, $4)`,
        [postCutoverAuthId, googleAccountId, postCutoverUserId, now],
      );

      const newGithubAccountId = "new-user-github";
      await pool.query(
        `INSERT INTO auth_account (id, "accountId", "providerId", "userId", "createdAt", "updatedAt") VALUES ($1, $2, 'github', $3, $4, $4)`,
        [createId(), newGithubAccountId, postCutoverUserId, now],
      );
      const newCommentId = createId();
      const newVoteId = createId();
      await pool.query(
        `INSERT INTO "Comment" (id, text, "postSlug", "userId", "createdAt", "updatedAt") VALUES ($1, 'new content', 'mcmaster-speed-secrets', $2, $3, $3)`,
        [newCommentId, postCutoverUserId, now],
      );
      await pool.query(
        `INSERT INTO "Vote" (id, "commentId", "userId", value, "createdAt", "updatedAt") VALUES ($1, $2, $3, 1, $4, $4)`,
        [newVoteId, newCommentId, postCutoverUserId, now],
      );

      const first = await reconcileLegacyAccountsFromAuth(pool);
      assert.equal(first.inserted, 2);
      assert.equal(first.skipped, 1);

      const second = await reconcileLegacyAccountsFromAuth(pool);
      assert.equal(second.inserted, 0);
      assert.equal(second.skipped, 3);

      const githubUser = await adapter.getUserByAccount({
        provider: "github",
        providerAccountId: legacyGithub,
      });
      const googleUser = await adapter.getUserByAccount({
        provider: "google",
        providerAccountId: googleAccountId,
      });
      assert.equal(githubUser?.id, legacyUserId);
      assert.equal(googleUser?.id, postCutoverUserId);
      const newGithubUser = await adapter.getUserByAccount({ provider: "github", providerAccountId: newGithubAccountId });
      assert.equal(newGithubUser?.id, postCutoverUserId);
      assert.equal((await pool.query('SELECT "userId" FROM "Comment" WHERE id = $1', [newCommentId])).rows[0].userId, postCutoverUserId);
      assert.equal((await pool.query('SELECT "userId" FROM "Vote" WHERE id = $1', [newVoteId])).rows[0].userId, postCutoverUserId);
      assert.equal((await pool.query('SELECT "emailVerified" FROM "User" WHERE id = $1', [postCutoverUserId])).rows[0].emailVerified, null);
      // Re-linking can legitimately change the new account's surrogate id.
      await pool.query('UPDATE auth_account SET id = $1 WHERE "providerId" = $2 AND "accountId" = $3',
        [createId(), "google", googleAccountId]);
      assert.deepEqual(await reconcileLegacyAccountsFromAuth(pool), { inserted: 0, skipped: 3 });
      await pool.query('INSERT INTO auth_account (id, "accountId", "providerId", "userId") VALUES ($1, $2, $3, $4)',
        [createId(), "unexpected-provider", "unsupported", postCutoverUserId]);
      await assert.rejects(() => reconcileLegacyAccountsFromAuth(pool), /Unsupported/);
    } finally {
      await prisma.$disconnect();
      await prismaPool.end();
      await pool.end();
      await fixture.stop();
    }
  });

  it("aborts reconciliation on conflicts without partial legacy inserts", async () => {
    const fixture = await startLoopbackPostgres();
    const pool = new pgDriver.Pool({ connectionString: fixture.databaseUrl });
    try {
      await applyLegacySchema(fixture.databaseUrl);
      const seed = await migrateEligibleFixture(fixture.databaseUrl);
      await adoptAndMigrate(fixture.databaseUrl);

      const conflictingAuthId = `z-${createId()}`;
      const otherUserId = createId();
      const now = new Date();

      await pool.query(
        `INSERT INTO "User" (id, name, email, "authEmailVerified", "authCreatedAt", "authUpdatedAt")
         VALUES ($1, 'Other', 'other.user@example.com', false, $2, $2)`,
        [otherUserId, now],
      );
      await pool.query(
        `INSERT INTO "Account" (id, "userId", type, provider, "providerAccountId")
         VALUES ($1, $2, 'oauth', 'google', 'conflict-google-id')`,
        [conflictingAuthId, seed.userId],
      );
      await pool.query(
        `INSERT INTO auth_account (id, "accountId", "providerId", "userId", "createdAt", "updatedAt")
         VALUES ($1, 'conflict-google-id', 'google', $2, $3, $3)`,
        [conflictingAuthId, otherUserId, now],
      );

      await pool.query(
        `INSERT INTO auth_account (id, "accountId", "providerId", "userId") VALUES ($1, 'valid-but-rolled-back', 'google', $2)`,
        [`a-${createId()}`, seed.userId],
      );
      const before = (await pool.query('SELECT * FROM "Account" ORDER BY id')).rows;

      await assert.rejects(() => reconcileLegacyAccountsFromAuth(pool), /conflicts|owned by|Account id/);

      const after = (await pool.query('SELECT * FROM "Account" ORDER BY id')).rows;
      assert.deepEqual(after, before);
    } finally {
      await pool.end();
      await fixture.stop();
    }
  });
});
