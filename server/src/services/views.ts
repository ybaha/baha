import type { ViewIncrementResultDto, ViewsMapDto } from "@baha/contracts";
import { eq, inArray, sql } from "drizzle-orm";

import type { AppDatabase } from "../db/client.js";
import { postViews } from "../db/schema.js";
import { throwApiError } from "../lib/api-error.js";
import { createId } from "../lib/ids.js";
import { isKnownWritingSlug } from "../lib/slug-manifest.js";

export type ViewsServiceDeps = {
  db: AppDatabase;
  knownSlugs: Set<string>;
  now?: () => Date;
};

const CACHE_TTL_MS = 60_000;

type CacheEntry = { value: number; expiresAt: number };

export function createViewsCache(): Map<string, CacheEntry> {
  return new Map();
}

export async function getViews(
  deps: ViewsServiceDeps,
  slugs: string[],
  cache: Map<string, CacheEntry>,
): Promise<ViewsMapDto> {
  const now = deps.now?.()?.getTime() ?? Date.now();
  const result: ViewsMapDto = {};
  const missing: string[] = [];

  for (const slug of slugs) {
    if (!isKnownWritingSlug(deps.knownSlugs, slug)) {
      result[slug] = 0;
      continue;
    }
    const cached = cache.get(slug);
    if (cached && cached.expiresAt > now) {
      result[slug] = cached.value;
      continue;
    }
    missing.push(slug);
  }

  if (missing.length > 0) {
    const rows = await deps.db
      .select({ slug: postViews.slug, count: postViews.count })
      .from(postViews)
      .where(inArray(postViews.slug, missing));
    const bySlug = new Map(rows.map((row) => [row.slug, row.count]));
    for (const slug of missing) {
      const count = bySlug.get(slug) ?? 0;
      result[slug] = count;
      cache.set(slug, { value: count, expiresAt: now + CACHE_TTL_MS });
    }
  }

  return result;
}

export async function incrementView(
  deps: ViewsServiceDeps,
  slug: string,
  cache: Map<string, CacheEntry>,
): Promise<ViewIncrementResultDto> {
  if (!isKnownWritingSlug(deps.knownSlugs, slug)) {
    throwApiError("NOT_FOUND", "Unknown post slug.", { message: "Unknown post slug." });
  }
  const now = deps.now?.() ?? new Date();

  const [row] = await deps.db.insert(postViews).values({
    id: createId(), slug, count: 1, createdAt: now, updatedAt: now,
  }).onConflictDoUpdate({
    target: postViews.slug,
    set: { count: sql`${postViews.count} + 1`, updatedAt: now },
  }).returning({ slug: postViews.slug, count: postViews.count });
  if (!row) throw new Error("View increment returned no row");

  cache.set(slug, {
    value: row.count,
    expiresAt: (deps.now?.() ?? new Date()).getTime() + CACHE_TTL_MS,
  });
  return { slug: row.slug, count: row.count };
}
