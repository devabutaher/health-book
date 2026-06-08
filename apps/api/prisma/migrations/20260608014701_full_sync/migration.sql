-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'CHECK_IN_REMINDER';
ALTER TYPE "NotificationType" ADD VALUE 'CHALLENGE_ENDING_SOON';

-- DropIndex
DROP INDEX "notifications_userId_read_createdAt_idx";

-- AlterTable
ALTER TABLE "challenge_participants" ADD COLUMN     "afterPhoto" TEXT,
ADD COLUMN     "beforePhoto" TEXT,
ADD COLUMN     "current_day_number" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "matchedValue" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "hashtags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "postCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hashtags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_hashtags" (
    "postId" TEXT NOT NULL,
    "hashtagId" TEXT NOT NULL,

    CONSTRAINT "post_hashtags_pkey" PRIMARY KEY ("postId","hashtagId")
);

-- CreateTable
CREATE TABLE "challenge_day_plans" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "tips" TEXT,
    "mediaUrls" TEXT[],
    "duration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "challenge_day_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "challenge_ratings" (
    "challengeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "review" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "challenge_ratings_pkey" PRIMARY KEY ("challengeId","userId")
);

-- CreateIndex
CREATE UNIQUE INDEX "hashtags_name_key" ON "hashtags"("name");

-- CreateIndex
CREATE INDEX "hashtags_name_idx" ON "hashtags"("name");

-- CreateIndex
CREATE INDEX "challenge_day_plans_challengeId_dayNumber_idx" ON "challenge_day_plans"("challengeId", "dayNumber");

-- CreateIndex
CREATE UNIQUE INDEX "challenge_day_plans_challengeId_dayNumber_key" ON "challenge_day_plans"("challengeId", "dayNumber");

-- CreateIndex
CREATE INDEX "challenge_ratings_challengeId_idx" ON "challenge_ratings"("challengeId");

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

-- CreateIndex
CREATE INDEX "story_likes_userId_idx" ON "story_likes"("userId");

-- AddForeignKey
ALTER TABLE "post_hashtags" ADD CONSTRAINT "post_hashtags_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_hashtags" ADD CONSTRAINT "post_hashtags_hashtagId_fkey" FOREIGN KEY ("hashtagId") REFERENCES "hashtags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_day_plans" ADD CONSTRAINT "challenge_day_plans_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_ratings" ADD CONSTRAINT "challenge_ratings_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_ratings" ADD CONSTRAINT "challenge_ratings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

