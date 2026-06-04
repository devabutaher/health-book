-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "message_type" TEXT DEFAULT 'text',
ADD COLUMN     "story_id" TEXT,
ADD COLUMN     "story_reply_data" JSONB;

-- AlterTable
ALTER TABLE "stories" ADD COLUMN     "background_color" TEXT,
ADD COLUMN     "text_font_size" INTEGER,
ADD COLUMN     "text_font_weight" TEXT,
ADD COLUMN     "text_position" TEXT DEFAULT 'center',
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'media',
ALTER COLUMN "mediaUrl" DROP NOT NULL,
ALTER COLUMN "mediaType" DROP NOT NULL;

