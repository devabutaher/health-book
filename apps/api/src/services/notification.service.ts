import { prisma } from "../lib/prisma";
import { AppError } from "../utils/AppError";
import { broadcastRealtime } from "../utils/realtime";
import type { NotificationType } from "../../generated/prisma";
import { sendPushNotification } from "./push.service";

function notifToPush(data: { type: NotificationType; fromUserName?: string; message?: string }): {
  title: string;
  body: string;
  url: string;
} {
  const name = data.fromUserName ?? "Someone";
  switch (data.type) {
    case "NEW_FOLLOWER":
      return { title: "New Follower", body: `${name} started following you`, url: "/feed" };
    case "POST_REACTION":
      return { title: "Post Reaction", body: `${name} reacted to your post`, url: "/feed" };
    case "POST_COMMENT":
      return { title: "New Comment", body: `${name} commented on your post`, url: "/feed" };
    case "COMMENT_REPLY":
      return { title: "Comment Reply", body: `${name} replied to your comment`, url: "/feed" };
    case "MENTION":
      return { title: "Mention", body: `${name} mentioned you`, url: "/feed" };
    case "MESSAGE":
      return {
        title: "New Message",
        body: data.message ?? `${name} sent you a message`,
        url: "/messages",
      };
    case "CHALLENGE_INVITE":
      return {
        title: "Challenge Invite",
        body: `${name} invited you to a challenge`,
        url: "/challenges",
      };
    case "CONSULTATION_BOOKED":
      return {
        title: "Consultation",
        body: data.message ?? "Consultation booked",
        url: "/my-book",
      };
    case "STREAK_MILESTONE":
      return {
        title: "Streak Milestone",
        body: "You reached a new streak milestone!",
        url: "/my-book",
      };
    case "STREAK_AT_RISK":
      return {
        title: "Streak at Risk",
        body: "Complete today's log to keep your streak!",
        url: "/my-book",
      };
    case "CHECK_IN_REMINDER":
      return {
        title: "Challenge Reminder",
        body: data.message ?? "Don't forget to check in!",
        url: "/challenges",
      };
    case "CHALLENGE_ENDING_SOON":
      return {
        title: "Challenge Ending Soon",
        body: data.message ?? "A challenge is ending soon!",
        url: "/challenges",
      };
    default:
      return {
        title: "HealthBook",
        body: data.message ?? "You have a new notification",
        url: "/feed",
      };
  }
}

export const notificationService = {
  async create(data: {
    type: NotificationType;
    userId: string;
    fromUserId?: string;
    postId?: string;
    commentId?: string;
    message?: string;
  }) {
    // Parallelize notification creation with fromUser lookup
    const [notification, fromUser] = await Promise.all([
      prisma.notification.create({ data }),
      data.fromUserId
        ? prisma.user.findUnique({ where: { id: data.fromUserId }, select: { name: true } })
        : Promise.resolve(null),
    ]);

    broadcastRealtime(
      `hb-notification:${data.userId}`,
      "INSERT",
      notification as unknown as Record<string, unknown>,
    ).catch((err) => {
      console.error(`[notification] realtime broadcast failed for user ${data.userId}`, err);
    });

    // Send push notification (fire-and-forget, no performance impact)
    const pushData = notifToPush({
      type: data.type,
      fromUserName: fromUser?.name,
      message: data.message,
    });

    sendPushNotification(data.userId, pushData.title, pushData.body, pushData.url).catch(() => {});

    return notification;
  },

  async list(userId: string, cursor?: string, limit = 20) {
    const [notifications, totalUnread] = await Promise.all([
      prisma.notification.findMany({
        where: { userId, type: { not: "MESSAGE" } },
        take: limit + 1,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        include: {
          fromUser: { select: { id: true, name: true, username: true, avatar: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.notification.count({
        where: { userId, read: false, type: { not: "MESSAGE" } },
      }),
    ]);

    const hasMore = notifications.length > limit;
    const items = hasMore ? notifications.slice(0, limit) : notifications;

    return {
      notifications: items,
      nextCursor: hasMore ? items[items.length - 1]?.id : null,
      hasMore,
      unreadCount: totalUnread,
    };
  },

  async markRead(userId: string, notificationId: string) {
    const notif = await prisma.notification.findFirst({ where: { id: notificationId, userId } });
    if (!notif) throw new AppError(404, "Notification not found");
    return prisma.notification.update({ where: { id: notificationId }, data: { read: true } });
  },

  async markAllRead(userId: string) {
    await prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
  },

  async getUnreadCount(userId: string) {
    return prisma.notification.count({ where: { userId, read: false, type: { not: "MESSAGE" } } });
  },

  async delete(userId: string, notificationId: string) {
    const notif = await prisma.notification.findFirst({ where: { id: notificationId, userId } });
    if (!notif) throw new AppError(404, "Notification not found");
    await prisma.notification.delete({ where: { id: notificationId } });
  },
};
