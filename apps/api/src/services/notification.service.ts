import { prisma } from "../lib/prisma";
import { supabase } from "../lib/supabase";
import { AppError } from "../utils/AppError";
import type { NotificationType } from "../../generated/prisma";
import { sendPushNotification } from "./push.service";

function notifToPush(data: {
  type: NotificationType;
  fromUserName?: string;
  message?: string;
}): { title: string; body: string; url: string } {
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
      return { title: "Challenge Invite", body: `${name} invited you to a challenge`, url: "/challenges" };
    case "CONSULTATION_BOOKED":
      return { title: "Consultation", body: data.message ?? "Consultation booked", url: "/my-book" };
    case "STREAK_MILESTONE":
      return { title: "Streak Milestone", body: "You reached a new streak milestone!", url: "/my-book" };
    case "STREAK_AT_RISK":
      return { title: "Streak at Risk", body: "Complete today's log to keep your streak!", url: "/my-book" };
    default:
      return { title: "HealthBook", body: data.message ?? "You have a new notification", url: "/feed" };
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
    const notification = await prisma.notification.create({ data });

    try {
      const channel = supabase.channel(`notification:${data.userId}`);
      const p = new Promise<void>((resolve, reject) => {
        const t = setTimeout(() => reject(new Error("timeout")), 3000);
        channel.subscribe((status) => {
          if (status === "SUBSCRIBED") {
            clearTimeout(t);
            resolve();
          }
          if (status === "CHANNEL_ERROR") {
            clearTimeout(t);
            reject(new Error("channel_error"));
          }
        });
      });
      await p;
      channel.send({
        type: "broadcast",
        event: "INSERT",
        payload: notification,
      });
      channel.unsubscribe();
    } catch {}

    // Send push notification (fire-and-forget, no performance impact)
    const fromUser = data.fromUserId
      ? await prisma.user.findUnique({ where: { id: data.fromUserId }, select: { name: true } })
      : null;

    const pushData = notifToPush({
      type: data.type,
      fromUserName: fromUser?.name,
      message: data.message,
    });

    sendPushNotification(data.userId, pushData.title, pushData.body, pushData.url).catch(() => {});

    return notification;
  },

  async list(userId: string, cursor?: string, limit = 20) {
    const notifications = await prisma.notification.findMany({
      where: { userId, type: { not: "MESSAGE" } },
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      include: {
        fromUser: { select: { id: true, name: true, username: true, avatar: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const hasMore = notifications.length > limit;
    const items = hasMore ? notifications.slice(0, limit) : notifications;

    return {
      notifications: items,
      nextCursor: hasMore ? items[items.length - 1]?.id : null,
      hasMore,
      unreadCount: await prisma.notification.count({
        where: { userId, read: false, type: { not: "MESSAGE" } },
      }),
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
