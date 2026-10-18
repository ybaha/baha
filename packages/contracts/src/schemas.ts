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

/** Optional context fields keep older deployed frontends compatible. */
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
  pageUrl: visitField(2048).optional(),
  referrer: visitField(2048).optional(),
  pageTitle: visitField(200).optional(),
  timezone: visitField(100).optional(),
  organization: visitField(200).optional(),
  postalCode: visitField(100).optional(),
  timestamp: z.string().datetime(),
});

export const visitsNotifyOutputSchema = z.object({
  status: z.literal("ok"),
  delivery: z.enum(["sent", "failed", "disabled", "deduplicated"]).optional(),
  stored: z.boolean().optional(),
});

export const visitsPublicKeyInputSchema = z.object({});
export const visitsPublicKeyOutputSchema = z.object({
  version: z.literal(1),
  keyId: z.string().regex(/^[a-f0-9]{32}$/),
  publicKey: z.string().length(87).regex(/^[A-Za-z0-9_-]+$/),
  serverTime: z.number().int().nonnegative(),
});

export const visitsEncryptedInputSchema = z.object({
  version: z.literal(1),
  keyId: z.string().regex(/^[a-f0-9]{32}$/),
  eventId: z.string().uuid(),
  sentAt: z.number().int().nonnegative(),
  ephemeralPublicKey: z.string().length(87).regex(/^[A-Za-z0-9_-]+$/),
  salt: z.string().length(22).regex(/^[A-Za-z0-9_-]+$/),
  iv: z.string().length(16).regex(/^[A-Za-z0-9_-]+$/),
  ciphertext: z.string().min(22).max(10944).regex(/^[A-Za-z0-9_-]+$/),
});
