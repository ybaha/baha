import { getCurrentSession } from "@/lib/auth/session";
import {
  buildCommentsPageResult,
  commentOrderBy,
  commentPageInclude,
} from "@/lib/comments/commentPage";
import { COMMENT_PAGE_LIMIT_MAX } from "@/lib/comments/policy";
import { validateCommentInput } from "@/lib/comments/validate";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

function parseLimit(raw: string | null): number {
  if (!raw) return 10;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return 10;
  return Math.min(parsed, COMMENT_PAGE_LIMIT_MAX);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const postSlug = searchParams.get("postSlug");
  if (!postSlug) {
    return NextResponse.json(
      { error: "Post slug is required" },
      { status: 400 }
    );
  }
  const cursor = searchParams.get("cursor") ?? undefined;
  const limit = parseLimit(searchParams.get("limit"));

  const session = await getCurrentSession();
  const currentUserId = session?.user?.id;

  const comments = await prisma.comment.findMany({
    where: { postSlug },
    take: limit + 1,
    ...(cursor && {
      skip: 1,
      cursor: { id: cursor },
    }),
    include: commentPageInclude,
    orderBy: commentOrderBy,
  });

  return NextResponse.json(buildCommentsPageResult(comments, limit, currentUserId));
}

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const input = validateCommentInput({ text: body.text, postSlug: body.postSlug });
  if (!input.ok) {
    return NextResponse.json({ error: input.error }, { status: 400 });
  }

  // Delegate to the canonical service so quota + serialization stay in one place.
  const { createComment } = await import("@/queries/createComment");
  const result = await createComment(input.text, input.postSlug);
  if (result.error || !result.data) {
    const status = result.error === "Unauthorized" ? 401 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }
  return NextResponse.json(result.data, { status: 201 });
}
