import type { Prisma } from "@/generated/prisma/client";

import type { CommentsPageResult, PublicComment } from "./types";

export const commentOrderBy: Prisma.CommentOrderByWithRelationInput[] = [
  { createdAt: "desc" },
  { id: "desc" },
];

const publicUserSelect = {
  name: true,
  image: true,
} satisfies Prisma.UserSelect;

export const commentPageInclude = {
  user: {
    select: publicUserSelect,
  },
  votes: {
    select: {
      value: true,
      userId: true,
    },
  },
} satisfies Prisma.CommentInclude;

type CommentRow = Prisma.CommentGetPayload<{
  include: typeof commentPageInclude;
}>;

export function serializeComment(
  comment: CommentRow,
  currentUserId: string | undefined
): PublicComment {
  const score = comment.votes.reduce((sum, vote) => sum + vote.value, 0);
  let currentUserVote: -1 | 0 | 1 = 0;
  if (currentUserId) {
    const ownVote = comment.votes.find((vote) => vote.userId === currentUserId);
    if (ownVote) {
      currentUserVote = ownVote.value > 0 ? 1 : -1;
    }
  }

  return {
    id: comment.id,
    text: comment.text,
    createdAt: comment.createdAt,
    user: {
      name: comment.user.name,
      image: comment.user.image,
    },
    score,
    currentUserVote,
  };
}

/** Cursor is the last comment id returned to the client (not the lookahead row). */
export function paginateCommentRows<T extends { id: string }>(
  rows: T[],
  limit: number
): { page: T[]; nextCursor: string | undefined } {
  if (rows.length > limit) {
    const page = rows.slice(0, limit);
    return {
      page,
      nextCursor: page[page.length - 1]?.id,
    };
  }
  return { page: rows, nextCursor: undefined };
}

export function buildCommentsPageResult(
  rows: CommentRow[],
  limit: number,
  currentUserId: string | undefined
): CommentsPageResult {
  const { page, nextCursor } = paginateCommentRows(rows, limit);
  return {
    comments: page.map((row) => serializeComment(row, currentUserId)),
    nextCursor,
  };
}
