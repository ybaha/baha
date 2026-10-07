"use strict";

const { URL } = require("node:url");

function assertLoopbackDatabaseUrl(databaseUrl) {
  if (!databaseUrl || typeof databaseUrl !== "string") {
    throw new Error("DATABASE_URL must be a non-empty string for integration tests");
  }

  const parsed = new URL(databaseUrl);
  const host = parsed.hostname;
  if (host !== "127.0.0.1" && host !== "localhost") {
    throw new Error(
      `Refusing non-loopback DATABASE_URL host "${host}" in integration harness`
    );
  }
}

module.exports = { assertLoopbackDatabaseUrl };
