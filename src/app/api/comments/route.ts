import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const postSlug = searchParams.get("postSlug");
  const cursor = searchParams.get("cursor");
  const limit = Number(searchParams.get("limit")) || 10;

  if (!postSlug) {
    return NextResponse.json(
      { error: "Post slug is required" },
      { status: 400 }
    );
  }

  const comments = await prisma.comment.findMany({
    where: { postSlug },
    take: limit + 1,
    ...(cursor && {
      skip: 1,
      cursor: {
        id: cursor,
      },
    }),
    include: {
      votes: true,
      user: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  let nextCursor: string | undefined = undefined;
  if (comments.length > limit) {
    const nextItem = comments.pop();
    nextCursor = nextItem?.id;
  }

  return NextResponse.json({
    comments,
    nextCursor,
  });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { text, postSlug } = await request.json();

  const comment = await prisma.comment.create({
    data: {
      text,
      postSlug,
      userId: session.user.id,
    },
  });

  return NextResponse.json(comment);
}
