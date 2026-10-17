import { z } from "zod";

import {
  COMMENT_CURSOR_MAX_LENGTH,
  COMMENT_ID_MAX_LENGTH,
  COMMENT_MAX_LENGTH,
  COMMENT_PAGE_LIMIT_MAX,
  MIN_COMMENT_LENGTH,
  POST_SLUG_MAX_LENGTH,
  POST_SLUG_PATTERN,
  VIEWS_SLUG_LIST_MAX,
} from "./policy.js";

export const postSlugSchema = z
  .string()
  .min(1)
  .max(POST_SLUG_MAX_LENGTH)
  .regex(POST_SLUG_PATTERN, "Post slug is invalid.");

export const commentTextSchema = z
  .string()
  .transform((value) => value.trim())
  .refine((value) => value.length >= MIN_COMMENT_LENGTH, {
    message: "Comment cannot be empty.",
  })
  .refine((value) => value.length <= COMMENT_MAX_LENGTH, {
    message: `Comment is too long. Make it shorter than ${COMMENT_MAX_LENGTH} characters.`,
  });

export const commentIdSchema = z.string().min(1).max(COMMENT_ID_MAX_LENGTH);

export const currentUserVoteSchema = z.union([
  z.literal(-1),
  z.literal(0),
  z.literal(1),
]);

export const publicCommentUserSchema = z.object({
  name: z.string().nullable(),
  image: z.string().nullable(),
});

export const publicCommentSchema = z.object({
  id: z.string(),
  text: z.string(),
  createdAt: z.string().datetime(),
  user: publicCommentUserSchema,
  score: z.number().int(),
  currentUserVote: currentUserVoteSchema,
});

export const commentsListInputSchema = z.object({
  postSlug: postSlugSchema,
  limit: z.number().int().min(1).max(COMMENT_PAGE_LIMIT_MAX).optional(),
  cursor: z.string().min(1).max(COMMENT_CURSOR_MAX_LENGTH).optional(),
});

export const commentsListOutputSchema = z.object({
  comments: z.array(publicCommentSchema),
  nextCursor: z.string().optional(),
});

export const commentsCreateInputSchema = z.object({
  postSlug: postSlugSchema,
  text: commentTextSchema,
});

export const commentsCreateOutputSchema = publicCommentSchema;

export const votesToggleInputSchema = z.object({
  commentId: commentIdSchema,
  liked: z.boolean(),
});

export const votesToggleOutputSchema = z.object({
  value: currentUserVoteSchema,
});

export const viewsGetInputSchema = z.object({
  slugs: z.array(postSlugSchema).min(1).max(VIEWS_SLUG_LIST_MAX),
});

export const viewsGetOutputSchema = z.record(z.string(), z.number().int().nonnegative());

export const viewsIncrementInputSchema = z.object({
  slug: postSlugSchema,
});

export const viewsIncrementOutputSchema = z.object({
  slug: z.string(),
  count: z.number().int().nonnegative(),
});

const visitField = (max: number) => z.string().max(max);

/** Mirrors `/api/status` visit notification payload (all string fields). */
export const visitsNotifyInputSchema = z.object({
  ip: visitField(200),
  city: visitField(200),
  region: visitField(200),
  country: visitField(200),
  location: visitField(200),
  userAgent: visitField(1024),
  platform: visitField(200),
  language: visitField(200),
  vendor: visitField(200),
  screenResolution: visitField(200),
  windowSize: visitField(200),
  timestamp: z.string().datetime(),
});

export const visitsNotifyOutputSchema = z.object({
  status: z.literal("ok"),
});
