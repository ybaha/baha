import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slugs = searchParams.get("slugs")?.split(",");

  if (!slugs) {
    return NextResponse.json(
      { error: "Slugs parameter is required" },
      { status: 400 }
    );
  }

  try {
    const views = await prisma.postView.findMany({
      where: {
        slug: {
          in: slugs,
        },
      },
    });

    // Create a map of slug to view count, defaulting to 0 for posts without views
    const viewsMap = slugs.reduce((acc, slug) => {
      const view = views.find((v) => v.slug === slug);
      acc[slug] = view?.count ?? 0;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({ data: viewsMap });
  } catch (error) {
    console.error("Error getting post views:", error);
    return NextResponse.json(
      { error: "Failed to get view counts" },
      { status: 500 }
    );
  }
}
