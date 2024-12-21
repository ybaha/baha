"use server";

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
}: GetCommentsParams) {
  const comments = await prisma.comment.findMany({
    where: {
      postSlug,
    },
    take: limit + 1, // take one extra to check if there are more
    ...(cursor && {
      skip: 1, // Skip the cursor
      cursor: {
        id: cursor,
      },
    }),
    include: {
      votes: {
        select: {
          id: true,
          value: true,
          userId: true,
          commentId: true,
        },
      },
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

  return {
    comments,
    nextCursor,
  };
}
