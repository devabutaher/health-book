-- CreateEnum
CREATE TYPE "ChallengeCategory" AS ENUM ('FITNESS', 'NUTRITION', 'MENTAL_HEALTH', 'SLEEP', 'GENERAL');

-- CreateEnum
CREATE TYPE "InviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

-- AlterTable
ALTER TABLE "challenges" ADD COLUMN     "category" "ChallengeCategory" DEFAULT 'GENERAL',
ADD COLUMN     "goalTarget" INTEGER,
ADD COLUMN     "goalUnit" TEXT,
ADD COLUMN     "milestones" JSONB,
ADD COLUMN     "templateId" TEXT;

-- AlterTable
ALTER TABLE "challenge_participants" ADD COLUMN     "achievedMilestones" JSONB,
ADD COLUMN     "mediaUrls" TEXT[];

-- CreateTable
CREATE TABLE "challenge_templates" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "ChallengeType" NOT NULL,
    "category" "ChallengeCategory" DEFAULT 'GENERAL',
    "goalTarget" INTEGER,
    "goalUnit" TEXT,
    "duration" INTEGER NOT NULL,
    "milestones" JSONB,
    "isOfficial" BOOLEAN NOT NULL DEFAULT false,
    "timesUsed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "challenge_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "challenge_comments" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "challenge_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_challenges" (
    "userId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_challenges_pkey" PRIMARY KEY ("userId","challengeId")
);

-- CreateTable
CREATE TABLE "challenge_invites" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "status" "InviteStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "challenge_invites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "challenge_comments_challengeId_createdAt_idx" ON "challenge_comments"("challengeId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "challenge_invites_toUserId_status_idx" ON "challenge_invites"("toUserId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "challenge_invites_challengeId_toUserId_key" ON "challenge_invites"("challengeId", "toUserId");

-- CreateIndex
CREATE INDEX "challenges_category_idx" ON "challenges"("category");

-- CreateIndex
CREATE INDEX "challenges_isActive_createdAt_idx" ON "challenges"("isActive", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "challenge_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_comments" ADD CONSTRAINT "challenge_comments_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_comments" ADD CONSTRAINT "challenge_comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_comments" ADD CONSTRAINT "challenge_comments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "challenge_comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_challenges" ADD CONSTRAINT "saved_challenges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_challenges" ADD CONSTRAINT "saved_challenges_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_invites" ADD CONSTRAINT "challenge_invites_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_invites" ADD CONSTRAINT "challenge_invites_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_invites" ADD CONSTRAINT "challenge_invites_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

