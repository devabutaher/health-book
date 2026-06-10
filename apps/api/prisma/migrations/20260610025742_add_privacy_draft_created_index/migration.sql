-- CreateIndex
CREATE INDEX "posts_privacy_is_draft_createdAt_idx" ON "posts"("privacy", "is_draft", "createdAt" DESC);

