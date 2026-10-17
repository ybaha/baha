import type { PublicCommentDto } from "@baha/contracts";

export type CommentVoteRow = { value: number; userId: string };
export type CommentWithRelations = {
  id: string;
  text: string;
  createdAt: Date;
  user: { name: string | null; image: string | null };
  votes: CommentVoteRow[];
};

export function serializeComment(
  comment: CommentWithRelations,
  currentUserId: string | undefined,
): PublicCommentDto {
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
    createdAt: comment.createdAt.toISOString(),
    user: {
      name: comment.user.name,
      image: comment.user.image,
    },
    score,
    currentUserVote,
  };
}

export function paginateCommentRows<T extends { id: string }>(
  rows: T[],
  limit: number,
): { page: T[]; nextCursor: string | undefined } {
  if (rows.length > limit) {
    const page = rows.slice(0, limit);
    return { page, nextCursor: page[page.length - 1]?.id };
  }
  return { page: rows, nextCursor: undefined };
}
