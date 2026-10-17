#!/usr/bin/env node
import { execSync } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const stdout = execSync("node --import tsx scripts/generate-slug-manifest-runner.mjs", {
  cwd: root,
  encoding: "utf8",
});
const writingSlugs = JSON.parse(stdout.trim());

const manifest = {
  writingSlugs,
  generatedAt: new Date().toISOString(),
};

const outPath = join(root, "server/src/slug-manifest.json");
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Wrote ${manifest.writingSlugs.length} slugs to ${outPath}`);
