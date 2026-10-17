import assert from "node:assert/strict";
import { it } from "node:test";
import { createDatabase } from "../../server/src/db/client.ts";
import { runMigrations } from "../../server/src/db/migrate.ts";
import { createViewsCache, incrementView } from "../../server/src/services/views.ts";
import { startLoopbackPostgres } from "./server-pg.mjs";

it("keeps timestamp-without-time-zone writes UTC on non-UTC Node hosts", { timeout: 20000 }, async () => {
  const fixture = await startLoopbackPostgres();
  const database = createDatabase({ connectionString: fixture.databaseUrl });
  const previous = process.env.TZ;
  try {
    process.env.TZ = "Pacific/Honolulu";
    await runMigrations(database.db, fixture.databaseUrl);
    assert.equal((await database.pool.query("SHOW timezone")).rows[0].TimeZone, "UTC");
    const cache = createViewsCache();
    const knownSlugs = new Set(["timezone-check"]);
    const now = new Date("2026-01-02T12:34:56.789Z");
    await incrementView({ db: database.db, knownSlugs, now: () => now }, "timezone-check", cache);
    const updated = new Date("2026-01-02T13:34:56.789Z");
    await incrementView({ db: database.db, knownSlugs, now: () => updated }, "timezone-check", cache);
    const { rows } = await database.pool.query(`SELECT count,
      to_char("createdAt", 'YYYY-MM-DD HH24:MI:SS.MS') AS created,
      to_char("updatedAt", 'YYYY-MM-DD HH24:MI:SS.MS') AS updated FROM "PostView" WHERE slug = $1`, ["timezone-check"]);
    assert.deepEqual(rows, [{ count: 2, created: "2026-01-02 12:34:56.789", updated: "2026-01-02 13:34:56.789" }]);
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
    await database.shutdown();
    await fixture.stop();
  }
});
