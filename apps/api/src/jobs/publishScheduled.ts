import { prisma } from "../lib/prisma";

export async function publishScheduledPosts() {
  const now = new Date();
  try {
    const result = await prisma.post.updateMany({
      where: { isDraft: true, scheduledAt: { lte: now }, publishedAt: null },
      data: { isDraft: false, publishedAt: now },
    });
    if (result.count > 0) {
      console.log(`[Cron] Published ${result.count} scheduled post(s)`);
    }
  } catch (err) {
    console.error("[Cron] Scheduled publish failed:", err);
  }
}
