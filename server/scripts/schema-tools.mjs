#!/usr/bin/env -S node --import tsx
import { adoptDrizzleBaseline, migrationChecksums } from "../src/db/migration-tools.ts";
export * from "../src/db/migration-tools.ts";

if (process.argv[2] === "checksums") {
  console.log(JSON.stringify(migrationChecksums(), null, 2));
}
if (process.argv[2] === "adopt") {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL required");
  console.log(JSON.stringify(await adoptDrizzleBaseline(url)));
}
