import assert from "node:assert/strict";
import { it } from "node:test";

import { createDatabase } from "../../server/src/db/client.ts";
import { runMigrations } from "../../server/src/db/migrate.ts";
import { createVisitRecorder } from "../../server/src/services/visit-records.ts";
import { startLoopbackPostgres } from "./server-pg.mjs";

const basePayload = {
  ip: "192.0.2.1",
  city: "Rotterdam",
  region: "South Holland",
  country: "Netherlands",
  location: "51.92,4.48",
  userAgent: "Test browser",
  platform: "Test platform",
  language: "en",
  vendor: "Test vendor",
  screenResolution: "1440x900",
  windowSize: "1200x800",
  timestamp: "2026-10-08T12:00:00.000Z",
};

it("persists sanitized visit rows with timestamptz accuracy", { timeout: 20000 }, async () => {
  const fixture = await startLoopbackPostgres();
  const database = createDatabase({ connectionString: fixture.databaseUrl });
  const previous = process.env.TZ;
  try {
    process.env.TZ = "Pacific/Honolulu";
    await runMigrations(database.db, fixture.databaseUrl);
    assert.equal((await database.pool.query("SHOW timezone")).rows[0].TimeZone, "UTC");

    const recorder = createVisitRecorder(database.db);
    const receivedAt = new Date("2026-10-08T12:00:02.123Z");
    const visitId = "visit-integration-1";
    const inserted = await recorder.record({
      id: visitId,
      payload: {
        ...basePayload,
        pageUrl: "https://ybaha.com/home?token=secret#frag",
        referrer: "https://example.com/path?email=x@y.com",
        pageTitle: "Portfolio",
        timezone: "Europe/Amsterdam",
        organization: "Example ISP",
        postalCode: "3011",
      },
      trustedIp: "203.0.113.8",
      receivedAt,
      encrypted: false,
    });
    assert.equal(inserted, true);

    const duplicate = await recorder.record({
      id: visitId,
      payload: basePayload,
      trustedIp: "203.0.113.8",
      receivedAt,
      encrypted: false,
    });
    assert.equal(duplicate, false);

    const { rows } = await database.pool.query(
      `SELECT
        "trustedIp",
        "reportedIp",
        "pageUrl",
        "referrer",
        "pageTitle",
        "notificationStatus",
        "notifiedAt",
        "failureCode",
        to_char("receivedAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS.MS') AS received,
        to_char("visitedAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS.MS') AS visited
      FROM "Visit"
      WHERE id = $1`,
      [visitId],
    );
    assert.equal(rows.length, 1);
    assert.deepEqual(rows[0], {
      trustedIp: "203.0.113.8",
      reportedIp: "192.0.2.1",
      pageUrl: "https://ybaha.com/home",
      referrer: "https://example.com/path",
      pageTitle: "Portfolio",
      notificationStatus: "pending",
      notifiedAt: null,
      failureCode: null,
      received: "2026-10-08 12:00:02.123",
      visited: "2026-10-08 12:00:00.000",
    });

    const sentAt = new Date("2026-10-08T12:00:05.000Z");
    await recorder.setNotificationStatus(visitId, "sent", sentAt);
    const { rows: sentRows } = await database.pool.query(
      `SELECT "notificationStatus",
        to_char("notifiedAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS.MS') AS notified
      FROM "Visit" WHERE id = $1`,
      [visitId],
    );
    assert.deepEqual(sentRows[0], {
      notificationStatus: "sent",
      notified: "2026-10-08 12:00:05.000",
    });

    const failedAt = new Date("2026-10-08T12:00:06.000Z");
    await recorder.setNotificationStatus(visitId, "failed", failedAt, "telegram_error");
    const { rows: failedRows } = await database.pool.query(
      `SELECT "notificationStatus", "failureCode",
        to_char("notifiedAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS.MS') AS notified
      FROM "Visit" WHERE id = $1`,
      [visitId],
    );
    assert.deepEqual(failedRows[0], {
      notificationStatus: "failed",
      failureCode: "telegram_error",
      notified: "2026-10-08 12:00:05.000",
    });
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
    await database.shutdown();
    await fixture.stop();
  }
});
