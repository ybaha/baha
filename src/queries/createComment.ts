"use server";

import {
  commentPageInclude,
  serializeComment,
} from "@/lib/comments/commentPage";
import { DAILY_COMMENT_QUOTA } from "@/lib/comments/policy";
import { validateCommentInput } from "@/lib/comments/validate";
import type { PublicComment } from "@/lib/comments/types";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";

export type CreateCommentResult =
  | { data: PublicComment; error: null }
  | { data: null; error: string };

const QUOTA_WINDOW_MS = 24 * 60 * 60 * 1000;

class CommentQuotaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CommentQuotaError";
  }
}

export async function createComment(
  text: string,
  postSlug: string
): Promise<CreateCommentResult> {
  const validated = validateCommentInput({ text, postSlug });
  if (!validated.ok) {
    return { data: null, error: validated.error };
  }

  const session = await getCurrentSession();
  if (!session?.user) {
    return { data: null, error: "Unauthorized" };
  }
  const userId = session.user.id;
  const since = new Date(Date.now() - QUOTA_WINDOW_MS);

  const comment = await prisma.$transaction(async (tx) => {
    // Serialize concurrent comments for the same user with a per-user
    // advisory lock. Combined with the count + insert in the same
    // transaction, this prevents the quota race without resorting to
    // SELECT FOR UPDATE on an aggregate (which Postgres rejects).
    await tx.$executeRaw`
      SELECT pg_advisory_xact_lock(hashtext(${`comment-quota:${userId}`}))
    `;
    const rows = await tx.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint AS count
      FROM "Comment"
      WHERE "userId" = ${userId} AND "createdAt" > ${since}
    `;
    const used = Number(rows[0]?.count ?? 0n);
    if (used >= DAILY_COMMENT_QUOTA) {
      throw new CommentQuotaError(
        "You have reached the maximum number of comments. Please delete some comments before posting again."
      );
    }
    return tx.comment.create({
      data: {
        text: validated.text,
        postSlug: validated.postSlug,
        userId,
      },
      include: commentPageInclude,
    });
  }).catch((error: unknown) => {
    if (error instanceof CommentQuotaError) {
      return { quotaError: error.message } as const;
    }
    throw error;
  });

  if ("quotaError" in comment) {
    return { data: null, error: comment.quotaError };
  }

  return {
    data: serializeComment(comment, userId),
    error: null,
  };
}
