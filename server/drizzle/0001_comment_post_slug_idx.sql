-- checkpoint B additive test migration
CREATE INDEX IF NOT EXISTS "Comment_postSlug_idx" ON "Comment"("postSlug");
