"use server";

import { prisma } from "@/lib/prisma";

export async function incrementPostView(slug: string) {
  try {
    const view = await prisma.postView.upsert({
      where: { slug },
      create: {
        slug,
        count: 1,
      },
      update: {
        count: {
          increment: 1,
        },
      },
    });
    return { data: view, error: null };
  } catch (error) {
    console.error("Error incrementing post view:", error);
    return { data: null, error: "Failed to increment view count" };
  }
}
