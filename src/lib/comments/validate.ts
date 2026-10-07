import { COMMENT_MAX_LENGTH, MIN_COMMENT_LENGTH } from "./policy";

const POST_SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9\-/]*[a-z0-9])?$/i;

export type CommentInput = {
  text: unknown;
  postSlug: unknown;
};

export type ValidatedComment =
  | { ok: true; text: string; postSlug: string }
  | { ok: false; error: string };

export function validateCommentInput(input: CommentInput): ValidatedComment {
  if (typeof input.postSlug !== "string" || input.postSlug.length === 0) {
    return { ok: false, error: "Post slug is required." };
  }
  if (!POST_SLUG_PATTERN.test(input.postSlug) || input.postSlug.length > 200) {
    return { ok: false, error: "Post slug is invalid." };
  }
  if (typeof input.text !== "string") {
    return { ok: false, error: "Comment text is required." };
  }
  const trimmed = input.text.trim();
  if (trimmed.length < MIN_COMMENT_LENGTH) {
    return { ok: false, error: "Comment cannot be empty." };
  }
  if (trimmed.length > COMMENT_MAX_LENGTH) {
    return {
      ok: false,
      error: `Comment is too long. Make it shorter than ${COMMENT_MAX_LENGTH} characters.`,
    };
  }
  return { ok: true, text: trimmed, postSlug: input.postSlug };
}
