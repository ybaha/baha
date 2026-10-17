#!/usr/bin/env node
import { build } from "esbuild";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
async function clientEntries(directory) {
  const entries = [];
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, item.name);
    if (item.isDirectory()) entries.push(...await clientEntries(file));
    else if (/\.[jt]sx?$/.test(item.name) && /^\s*["']use client["']/.test(await readFile(file, "utf8"))) {
      entries.push(file);
    }
  }
  return entries;
}

const entries = [...new Set([
  ...await clientEntries(path.join(root, "src")),
  path.join(root, "src/lib/api.ts"),
  path.join(root, "src/lib/auth-client.ts"),
  path.join(root, "packages/contracts/src/index.ts"),
])];
const result = await build({
  entryPoints: entries,
  outdir: path.join(root, "out/browser-boundary-check"),
  bundle: true,
  write: false,
  platform: "browser",
  format: "esm",
  metafile: true,
  logLevel: "silent",
  // Next's compiler owns framework code; inspect every application client entry
  // and its remaining transitive dependencies with esbuild's actual resolver.
  external: ["react", "react-dom", "next", "next/*"],
  loader: { ".webp": "file", ".png": "file", ".jpg": "file", ".svg": "file" },
  define: { "process.env.NODE_ENV": '"production"' },
  alias: { "@": path.join(root, "src") },
});

const forbiddenPackage = /(?:^|\/)node_modules\/(?:pg|pg-pool|pg-connection-string|drizzle-orm|drizzle-kit|prisma|next-auth|server-only|@prisma\/client|@baha\/server|@orpc\/server)(?:\/|$)/;
const forbiddenAuth = /(?:^|\/)node_modules\/(?:@better-auth\/[^/]*adapter|better-auth\/dist\/(?:api|adapters|auth|context|db))(?:\/|$)/;
const violations = Object.keys(result.metafile.inputs).filter((input) => {
  const relative = path.relative(root, path.resolve(root, input)).replaceAll(path.sep, "/");
  return relative.startsWith("server/") || relative.startsWith("test/generated/")
    || relative.startsWith("src/generated/") || forbiddenPackage.test(relative) || forbiddenAuth.test(relative);
});
if (violations.length) {
  console.error("Browser dependency graph contains server code:\n" + violations.join("\n"));
  process.exit(1);
}
console.log(`Browser dependency graph passed (${entries.length} client/contract entries).`);
