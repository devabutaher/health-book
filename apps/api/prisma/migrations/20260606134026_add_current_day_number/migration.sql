-- AlterTable
ALTER TABLE "challenge_participants" ADD COLUMN     "current_day_number" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "matchedValue" DOUBLE PRECISION;

