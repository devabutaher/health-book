-- DropIndex
DROP INDEX "notifications_userId_read_createdAt_idx";

-- CreateIndex
CREATE INDEX "post_poll_votes_pollId_idx" ON "post_poll_votes"("pollId");

-- CreateIndex
CREATE INDEX "post_quiz_answers_postId_idx" ON "post_quiz_answers"("postId");

-- CreateIndex
CREATE INDEX "comments_postId_parentId_idx" ON "comments"("postId", "parentId");

-- CreateIndex
CREATE INDEX "health_logs_user_id_is_public_idx" ON "health_logs"("user_id", "is_public");

-- CreateIndex
CREATE INDEX "notifications_userId_type_read_createdAt_idx" ON "notifications"("userId", "type", "read", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "conversation_participants_userId_idx" ON "conversation_participants"("userId");

-- CreateIndex
CREATE INDEX "conversation_participants_conversationId_role_idx" ON "conversation_participants"("conversationId", "role");

-- CreateIndex
CREATE INDEX "messages_senderId_idx" ON "messages"("senderId");

-- CreateIndex
CREATE INDEX "group_members_userId_idx" ON "group_members"("userId");

-- CreateIndex
CREATE INDEX "group_members_userId_role_idx" ON "group_members"("userId", "role");

-- CreateIndex
CREATE INDEX "group_members_groupId_role_idx" ON "group_members"("groupId", "role");

-- CreateIndex
CREATE INDEX "group_join_requests_groupId_status_idx" ON "group_join_requests"("groupId", "status");

-- CreateIndex
CREATE INDEX "group_invites_userId_status_idx" ON "group_invites"("userId", "status");

-- CreateIndex
CREATE INDEX "challenge_participants_userId_idx" ON "challenge_participants"("userId");

-- CreateIndex
CREATE INDEX "challenge_participants_challengeId_completed_idx" ON "challenge_participants"("challengeId", "completed");

-- CreateIndex
CREATE INDEX "challenge_participants_userId_completed_idx" ON "challenge_participants"("userId", "completed");

-- CreateIndex
CREATE INDEX "challenge_comment_reactions_commentId_idx" ON "challenge_comment_reactions"("commentId");

-- CreateIndex
CREATE INDEX "challenge_day_entries_challengeId_userId_completed_idx" ON "challenge_day_entries"("challengeId", "userId", "completed");

-- CreateIndex
CREATE INDEX "saved_challenges_userId_idx" ON "saved_challenges"("userId");

-- CreateIndex
CREATE INDEX "stories_expiresAt_idx" ON "stories"("expiresAt");

-- CreateIndex
CREATE INDEX "story_reactions_userId_storyId_idx" ON "story_reactions"("userId", "storyId");

-- CreateIndex
CREATE INDEX "story_views_userId_idx" ON "story_views"("userId");

