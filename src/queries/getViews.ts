"use server";

import { prisma } from "@/lib/prisma";
import type { PostView } from "@prisma/client";

export async function getViews(slugs: string[]) {
  try {
    const views = await prisma.postView.findMany({
      where: {
        slug: {
          in: slugs,
        },
      },
    });

    // Create a map of slug to view count, defaulting to 0 for posts without views
    const viewsMap = slugs.reduce<Record<string, number>>((acc, slug) => {
      const view = views.find((v: PostView) => v.slug === slug);
      acc[slug] = view?.count ?? 0;
      return acc;
    }, {});

    return { data: viewsMap, error: null };
  } catch (error) {
    console.error("Error getting post views:", error);
    return { data: null, error: "Failed to get view counts" };
  }
}
