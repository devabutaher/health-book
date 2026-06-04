-- CreateEnum
CREATE TYPE "ChallengeDifficulty" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ReactionType" ADD VALUE 'FIRE';
ALTER TYPE "ReactionType" ADD VALUE 'STRONG';
ALTER TYPE "ReactionType" ADD VALUE 'HUNDRED';

-- AlterEnum
ALTER TYPE "ChallengeType" ADD VALUE 'DUEL';

-- AlterTable
ALTER TABLE "challenges" ADD COLUMN     "dayCount" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "difficulty" "ChallengeDifficulty" DEFAULT 'BEGINNER';

-- AlterTable
ALTER TABLE "challenge_participants" DROP COLUMN "mediaUrls",
DROP COLUMN "progress";

-- CreateTable
CREATE TABLE "challenge_comment_reactions" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ReactionType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "challenge_comment_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "challenge_day_entries" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "mediaUrls" TEXT[],
    "sharedToFeed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "challenge_day_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "challenge_activities" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "challenge_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "challenge_comment_reactions_commentId_userId_type_key" ON "challenge_comment_reactions"("commentId", "userId", "type");

-- CreateIndex
CREATE INDEX "challenge_day_entries_challengeId_userId_dayNumber_idx" ON "challenge_day_entries"("challengeId", "userId", "dayNumber");

-- CreateIndex
CREATE UNIQUE INDEX "challenge_day_entries_challengeId_userId_dayNumber_key" ON "challenge_day_entries"("challengeId", "userId", "dayNumber");

-- CreateIndex
CREATE INDEX "challenge_activities_challengeId_createdAt_idx" ON "challenge_activities"("challengeId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "challenges_difficulty_idx" ON "challenges"("difficulty");

-- AddForeignKey
ALTER TABLE "challenge_comment_reactions" ADD CONSTRAINT "challenge_comment_reactions_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "challenge_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_comment_reactions" ADD CONSTRAINT "challenge_comment_reactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_day_entries" ADD CONSTRAINT "challenge_day_entries_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_day_entries" ADD CONSTRAINT "challenge_day_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_day_entries" ADD CONSTRAINT "challenge_day_entries_challengeId_userId_fkey" FOREIGN KEY ("challengeId", "userId") REFERENCES "challenge_participants"("challengeId", "userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_activities" ADD CONSTRAINT "challenge_activities_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_activities" ADD CONSTRAINT "challenge_activities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

