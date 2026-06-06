-- CreateIndex
CREATE INDEX "follows_followingId_idx" ON "follows"("followingId");

-- CreateIndex
CREATE INDEX "comments_postId_idx" ON "comments"("postId");

-- CreateIndex
CREATE INDEX "comments_userId_idx" ON "comments"("userId");

-- CreateIndex
CREATE INDEX "saved_posts_userId_idx" ON "saved_posts"("userId");

-- CreateIndex
CREATE INDEX "groups_type_idx" ON "groups"("type");

-- CreateIndex
CREATE INDEX "group_members_role_idx" ON "group_members"("role");

-- CreateIndex
CREATE INDEX "reels_userId_idx" ON "reels"("userId");

