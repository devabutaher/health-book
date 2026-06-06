import { prisma } from "../lib/prisma";
import { notifyMentions } from "../utils/mentions";

export async function publishScheduledPosts() {
  const now = new Date();
  try {
    const duePosts = await prisma.post.findMany({
      where: { isDraft: true, scheduledAt: { lte: now }, publishedAt: null },
      select: { id: true, content: true, scheduledAt: true, userId: true },
    });

    if (duePosts.length === 0) return;

    await prisma.$transaction(
      duePosts.map((post) =>
        prisma.post.update({
          where: { id: post.id },
          data: {
            isDraft: false,
            publishedAt: post.scheduledAt || now,
          },
        }),
      ),
    );

    for (const post of duePosts) {
      if (post.content) {
        notifyMentions(post.content, post.userId, post.id).catch(() => {});
      }
    }

    console.log(`[Cron] Published ${duePosts.length} scheduled post(s)`);
  } catch (err) {
    console.error("[Cron] Scheduled publish failed:", err);
  }
}
