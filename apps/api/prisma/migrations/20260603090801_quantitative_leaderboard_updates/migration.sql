-- AlterTable
ALTER TABLE "challenge_participants" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "totalValue" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "challenge_day_entries" ADD COLUMN     "value" DOUBLE PRECISION;

