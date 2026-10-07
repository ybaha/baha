"use server";

import { getCurrentSession } from "@/lib/auth/session";
import {
  buildCommentsPageResult,
  commentOrderBy,
  commentPageInclude,
} from "@/lib/comments/commentPage";
import type { CommentsPageResult } from "@/lib/comments/types";
import { prisma } from "@/lib/prisma";

type GetCommentsParams = {
  postSlug: string;
  limit?: number;
  cursor?: string;
};

export async function getComments({
  postSlug,
  limit = 10,
  cursor,
}: GetCommentsParams): Promise<CommentsPageResult> {
  const session = await getCurrentSession();
  const currentUserId = session?.user?.id;

  const comments = await prisma.comment.findMany({
    where: {
      postSlug,
    },
    take: limit + 1,
    ...(cursor && {
      skip: 1,
      cursor: {
        id: cursor,
      },
    }),
    include: commentPageInclude,
    orderBy: commentOrderBy,
  });

  return buildCommentsPageResult(comments, limit, currentUserId);
}
