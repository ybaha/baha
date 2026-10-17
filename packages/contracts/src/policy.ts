export const COMMENT_MAX_LENGTH = 1000;
export const COMMENT_PAGE_LIMIT_MAX = 50;
export const DAILY_COMMENT_QUOTA = 10;
export const MIN_COMMENT_LENGTH = 1;
export const POST_SLUG_MAX_LENGTH = 200;
export const VIEWS_SLUG_LIST_MAX = 200;
export const COMMENT_ID_MAX_LENGTH = 64;
export const COMMENT_CURSOR_MAX_LENGTH = 64;

/** Matches `src/lib/comments/validate.ts` and view increment guards. */
export const POST_SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9\-/]*[a-z0-9])?$/i;
