#!/usr/bin/env node
import { build } from "esbuild";
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outdir = join(root, "server/dist");

mkdirSync(outdir, { recursive: true });

await build({
  entryPoints: [join(root, "server/src/main.ts")],
  outfile: join(outdir, "main.js"),
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node22",
  packages: "external",
  sourcemap: true,
});

copyFileSync(
  join(root, "server/src/slug-manifest.json"),
  join(outdir, "slug-manifest.json"),
);

console.log("Built server artifact in server/dist");
