import type { VoteToggleResultDto } from "@baha/contracts";
import { and, eq, sql } from "drizzle-orm";

import type { AppDatabase } from "../db/client.js";
import { comments, votes } from "../db/schema.js";
import { throwApiError } from "../lib/api-error.js";
import { createId } from "../lib/ids.js";

export type VotesServiceDeps = { db: AppDatabase; now?: () => Date };

export async function toggleVote(
  deps: VotesServiceDeps,
  input: { commentId: string; liked: boolean },
  userId: string,
): Promise<VoteToggleResultDto> {
  const desired: -1 | 1 = input.liked ? 1 : -1;
  const now = deps.now?.() ?? new Date();

  return deps.db.transaction(async (tx) => {
    await tx.execute(
      sql`SELECT pg_advisory_xact_lock(hashtext(${`vote:${userId}:${input.commentId}`}))`,
    );

    const target = await tx
      .select({ id: comments.id })
      .from(comments)
      .where(eq(comments.id, input.commentId))
      .limit(1);
    if (!target[0]) {
      throwApiError("NOT_FOUND", "Comment not found.", { message: "Comment not found." });
    }

    const existing = await tx
      .select({ id: votes.id, value: votes.value })
      .from(votes)
      .where(and(eq(votes.userId, userId), eq(votes.commentId, input.commentId)))
      .limit(1);

    const row = existing[0];
    if (!row) {
      await tx.insert(votes).values({
        id: createId(),
        userId,
        commentId: input.commentId,
        value: desired,
        createdAt: now,
        updatedAt: now,
      });
      return { value: desired };
    }

    if (row.value === desired) {
      await tx.delete(votes).where(eq(votes.id, row.id));
      return { value: 0 as const };
    }

    await tx
      .update(votes)
      .set({ value: desired, updatedAt: now })
      .where(eq(votes.id, row.id));
    return { value: desired };
  });
}
