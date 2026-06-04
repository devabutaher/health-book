-- CreateTable
CREATE TABLE "post_polls" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "options" TEXT[],
    "is_multiple_choice" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "post_polls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_poll_votes" (
    "id" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "option_index" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_poll_votes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "post_polls_postId_key" ON "post_polls"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "post_poll_votes_pollId_userId_option_index_key" ON "post_poll_votes"("pollId", "userId", "option_index");

-- AddForeignKey
ALTER TABLE "post_polls" ADD CONSTRAINT "post_polls_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_poll_votes" ADD CONSTRAINT "post_poll_votes_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "post_polls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_poll_votes" ADD CONSTRAINT "post_poll_votes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

