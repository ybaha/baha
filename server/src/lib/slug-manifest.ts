import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export type SlugManifest = {
  writingSlugs: string[];
  generatedAt: string;
};

let cached: Set<string> | null = null;
let cachedPath: string | null = null;

export function loadSlugManifest(manifestPath?: string): Set<string> {
  const resolved =
    manifestPath ??
    join(dirname(fileURLToPath(import.meta.url)), "..", "slug-manifest.json");
  if (cached && cachedPath === resolved) {
    return cached;
  }
  const raw = readFileSync(resolved, "utf8");
  const parsed = JSON.parse(raw) as SlugManifest;
  if (!Array.isArray(parsed.writingSlugs)) {
    throw new Error("Invalid slug manifest");
  }
  cached = new Set(parsed.writingSlugs);
  cachedPath = resolved;
  return cached;
}

export function resetSlugManifestCacheForTests(): void {
  cached = null;
  cachedPath = null;
}

export function isKnownWritingSlug(slugs: Set<string>, slug: string): boolean {
  return slugs.has(slug);
}
