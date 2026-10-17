import {
  DAILY_COMMENT_QUOTA,
  type CommentsCreateResultDto,
  type CommentsListResultDto,
} from "@baha/contracts";
import { and, desc, eq, gt, inArray, lt, or, sql } from "drizzle-orm";

import type { AppDatabase } from "../db/client.js";
import { comments, users, votes } from "../db/schema.js";
import { throwApiError } from "../lib/api-error.js";
import { createId } from "../lib/ids.js";
import { isKnownWritingSlug } from "../lib/slug-manifest.js";
import {
  paginateCommentRows,
  serializeComment,
} from "./comment-serialize.js";

const QUOTA_WINDOW_MS = 24 * 60 * 60 * 1000;

export type CommentsServiceDeps = {
  db: AppDatabase;
  knownSlugs: Set<string>;
  now?: () => Date;
};

async function loadCommentPage(
  db: AppDatabase,
  rows: Array<{ id: string }>,
  currentUserId: string | undefined,
) {
  if (rows.length === 0) {
    return [];
  }
  const ids = rows.map((row) => row.id);
  const detailed = await db
    .select({
      id: comments.id,
      text: comments.text,
      createdAt: comments.createdAt,
      userName: users.name,
      userImage: users.image,
    })
    .from(comments)
    .innerJoin(users, eq(comments.userId, users.id))
    .where(inArray(comments.id, ids));

  const voteRows = await db
    .select({
      commentId: votes.commentId,
      value: votes.value,
      userId: votes.userId,
    })
    .from(votes)
    .where(inArray(votes.commentId, ids));

  const votesByComment = new Map<string, Array<{ value: number; userId: string }>>();
  for (const vote of voteRows) {
    const bucket = votesByComment.get(vote.commentId) ?? [];
    bucket.push({ value: vote.value, userId: vote.userId });
    votesByComment.set(vote.commentId, bucket);
  }

  const byId = new Map(
    detailed.map((row) => [
      row.id,
      {
        id: row.id,
        text: row.text,
        createdAt: row.createdAt,
        user: { name: row.userName, image: row.userImage },
        votes: votesByComment.get(row.id) ?? [],
      },
    ]),
  );

  return rows
    .map((row) => byId.get(row.id))
    .filter((row): row is NonNullable<typeof row> => Boolean(row))
    .map((row) => serializeComment(row, currentUserId));
}

export async function listComments(
  deps: CommentsServiceDeps,
  input: { postSlug: string; limit: number; cursor?: string },
  currentUserId: string | undefined,
): Promise<CommentsListResultDto> {
  const limit = input.limit;
  if (input.cursor) {
    const cursorRow = await deps.db
      .select({ id: comments.id, postSlug: comments.postSlug })
      .from(comments)
      .where(eq(comments.id, input.cursor))
      .limit(1);
    const cursor = cursorRow[0];
    if (!cursor || cursor.postSlug !== input.postSlug) {
      throwApiError("NOT_FOUND", "Comment cursor not found.");
    }
  }

  const baseQuery = deps.db
    .select({ id: comments.id, createdAt: comments.createdAt })
    .from(comments)
    .where(eq(comments.postSlug, input.postSlug))
    .orderBy(desc(comments.createdAt), desc(comments.id))
    .limit(limit + 1);

  let idRows;
  if (input.cursor) {
    const cursorMeta = await deps.db
      .select({ createdAt: comments.createdAt, id: comments.id })
      .from(comments)
      .where(eq(comments.id, input.cursor))
      .limit(1);
    const cursor = cursorMeta[0]!;
    idRows = await deps.db
      .select({ id: comments.id, createdAt: comments.createdAt })
      .from(comments)
      .where(
        and(
          eq(comments.postSlug, input.postSlug),
          or(
            lt(comments.createdAt, cursor.createdAt),
            and(
              eq(comments.createdAt, cursor.createdAt),
              lt(comments.id, cursor.id),
            ),
          ),
        ),
      )
      .orderBy(desc(comments.createdAt), desc(comments.id))
      .limit(limit + 1);
  } else {
    idRows = await baseQuery;
  }

  const { page, nextCursor } = paginateCommentRows(idRows, limit);
  const serialized = await loadCommentPage(deps.db, page, currentUserId);
  return { comments: serialized, nextCursor };
}

export async function createComment(
  deps: CommentsServiceDeps,
  input: { postSlug: string; text: string },
  userId: string,
): Promise<CommentsCreateResultDto> {
  if (!isKnownWritingSlug(deps.knownSlugs, input.postSlug)) {
    throwApiError("VALIDATION", "Post slug is invalid.", {
      message: "Post slug is invalid.",
    });
  }

  const now = deps.now?.() ?? new Date();
  const since = new Date(now.getTime() - QUOTA_WINDOW_MS);

  const created = await deps.db.transaction(async (tx) => {
    await tx.execute(
      sql`SELECT pg_advisory_xact_lock(hashtext(${`comment-quota:${userId}`}))`,
    );
    const countRows = await tx
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(comments)
      .where(and(eq(comments.userId, userId), gt(comments.createdAt, since)));
    const used = countRows[0]?.count ?? 0;
    if (used >= DAILY_COMMENT_QUOTA) {
      throwApiError(
        "QUOTA_EXCEEDED",
        "You have reached the maximum number of comments. Please delete some comments before posting again.",
        {
          message:
            "You have reached the maximum number of comments. Please delete some comments before posting again.",
        },
      );
    }

    const id = createId();
    const [row] = await tx
      .insert(comments)
      .values({
        id,
        text: input.text,
        postSlug: input.postSlug,
        userId,
        createdAt: now,
        updatedAt: now,
      })
      .returning({
        id: comments.id,
        text: comments.text,
        createdAt: comments.createdAt,
      });

    const [author] = await tx
      .select({ name: users.name, image: users.image })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return serializeComment(
      {
        id: row!.id,
        text: row!.text,
        createdAt: row!.createdAt,
        user: author ?? { name: null, image: null },
        votes: [],
      },
      userId,
    );
  });

  return created;
}
