import type pg from "pg";

const ALLOWED_PROVIDERS = ["github", "google"] as const;
const RECONCILE_LOCK_KEY = "auth-legacy-account-reconcile";

type AllowedProvider = (typeof ALLOWED_PROVIDERS)[number];

type AuthAccountRow = {
  id: string;
  accountId: string;
  providerId: string;
  userId: string;
};

type LegacyAccountRow = {
  type: string;
  id: string;
  userId: string;
  provider: string;
  providerAccountId: string;
};

export type ReconcileLegacyAccountsResult = {
  inserted: number;
  skipped: number;
};

function isAllowedProvider(provider: string): provider is AllowedProvider {
  return (ALLOWED_PROVIDERS as readonly string[]).includes(provider);
}

async function assertUserProfileReady(
  client: pg.PoolClient,
  userId: string,
  authAccountId: string,
): Promise<void> {
  const { rows } = await client.query<{ name: string | null; email: string | null }>(
    `SELECT name, email FROM "User" WHERE id = $1`,
    [userId],
  );
  const user = rows[0];
  if (!user) {
    throw new Error(
      `auth_account ${authAccountId} references missing user ${userId}`,
    );
  }
  if (!user.name?.trim() || !user.email?.trim()) {
    throw new Error(
      `auth_account ${authAccountId} user ${userId} missing non-empty name/email`,
    );
  }
  if (user.email !== user.email.trim()) {
    throw new Error(
      `auth_account ${authAccountId} user ${userId} email is not trimmed`,
    );
  }
  if (user.email !== user.email.toLowerCase()) {
    throw new Error(
      `auth_account ${authAccountId} user ${userId} email is not lowercase-normalized`,
    );
  }
}

/**
 * Paused-write rollback helper: copy missing github/google provider links from
 * auth_account into legacy "Account" without touching sessions or user content.
 */
export async function reconcileLegacyAccountsFromAuth(
  pool: pg.Pool,
): Promise<ReconcileLegacyAccountsResult> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [
      RECONCILE_LOCK_KEY,
    ]);

    await client.query('LOCK TABLE "User", "Account", auth_account IN SHARE ROW EXCLUSIVE MODE');
    const { rows: authRows } = await client.query<AuthAccountRow>(
      `SELECT id, "accountId", "providerId", "userId"
       FROM auth_account ORDER BY id ASC`,
    );

    let inserted = 0;
    let skipped = 0;

    for (const authRow of authRows) {
      if (!isAllowedProvider(authRow.providerId)) {
        throw new Error(
          `Unsupported auth_account provider ${authRow.providerId}`,
        );
      }

      if (!authRow.id.trim() || !authRow.accountId.trim()) {
        throw new Error("Auth account identity must be non-empty");
      }
      await assertUserProfileReady(client, authRow.userId, authRow.id);

      const byProvider = await client.query<LegacyAccountRow>(
        `SELECT id, "userId", type, provider, "providerAccountId"
         FROM "Account"
         WHERE provider = $1 AND "providerAccountId" = $2`,
        [authRow.providerId, authRow.accountId],
      );

      if (byProvider.rows.length > 0) {
        const legacy = byProvider.rows[0];
        if (legacy.userId !== authRow.userId) {
          throw new Error(
            `Provider ${authRow.providerId}:${authRow.accountId} owned by different users`,
          );
        }
        if (legacy.type !== "oauth") {
          throw new Error("Legacy provider association is not OAuth");
        }
        skipped += 1;
        continue;
      }

      const byId = await client.query<LegacyAccountRow>(
        `SELECT id, "userId", type, provider, "providerAccountId"
         FROM "Account"
         WHERE id = $1`,
        [authRow.id],
      );
      if (byId.rows.length > 0) {
        const legacy = byId.rows[0];
        if (
          legacy.type !== "oauth" ||
          legacy.userId !== authRow.userId ||
          legacy.provider !== authRow.providerId ||
          legacy.providerAccountId !== authRow.accountId
        ) {
          throw new Error(`Account id ${authRow.id} conflicts with legacy row`);
        }
        skipped += 1;
        continue;
      }

      await client.query(
        `INSERT INTO "Account" (
          id,
          "userId",
          type,
          provider,
          "providerAccountId",
          refresh_token,
          access_token,
          expires_at,
          token_type,
          scope,
          id_token,
          session_state
        ) VALUES ($1, $2, 'oauth', $3, $4, NULL, NULL, NULL, NULL, NULL, NULL, NULL)`,
        [authRow.id, authRow.userId, authRow.providerId, authRow.accountId],
      );
      inserted += 1;
    }

    await client.query("COMMIT");
    return { inserted, skipped };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
