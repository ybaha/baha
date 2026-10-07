"use server";

import { getAllWritingsMeta } from "@/lib/content/selectors";
import { prisma } from "@/lib/prisma";

const POST_SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9\-/]*[a-z0-9])?$/i;

export type IncrementPostViewResult =
  | { data: { slug: string; count: number }; error: null }
  | { data: null; error: string };

export async function incrementPostView(
  slug: string
): Promise<IncrementPostViewResult> {
  if (typeof slug !== "string" || !POST_SLUG_PATTERN.test(slug) || slug.length > 200) {
    return { data: null, error: "Invalid post slug." };
  }
  const knownSlugs = new Set(
    getAllWritingsMeta().map((writing) => writing.slug)
  );
  if (!knownSlugs.has(slug)) {
    return { data: null, error: "Unknown post slug." };
  }

  try {
    const view = await prisma.postView.upsert({
      where: { slug },
      create: { slug, count: 1 },
      update: { count: { increment: 1 } },
    });
    return { data: { slug: view.slug, count: view.count }, error: null };
  } catch (error) {
    console.error("Error incrementing post view:", error);
    return { data: null, error: "Failed to increment view count" };
  }
}
