import { prisma } from "../lib/prisma";
import { notificationService } from "../services/notification.service";

const MENTION_REGEX = /@([\w.-]+)/g;

export function extractUsernames(content: string): string[] {
  const matches = content.match(MENTION_REGEX);
  if (!matches) return [];
  return [...new Set(matches.map((m) => m.slice(1)))];
}

export async function notifyMentions(
  content: string,
  fromUserId: string,
  postId?: string,
  commentId?: string,
) {
  const usernames = extractUsernames(content);
  if (usernames.length === 0) return;

  const mentionedUsers = await prisma.user.findMany({
    where: { username: { in: usernames } },
    select: { id: true, username: true },
  });

  for (const user of mentionedUsers) {
    if (user.id === fromUserId) continue;
    notificationService
      .create({
        type: "MENTION",
        userId: user.id,
        fromUserId,
        postId,
        commentId,
      })
      .catch(() => {});
  }
}
