import { prisma } from "../lib/prisma";
import { Prisma } from "../../generated/prisma";
import { supabase } from "../lib/supabase";
import { AppError } from "../utils/AppError";
import { notificationService } from "./notification.service";

export const messageService = {
  async listConversations(userId: string) {
    const participations = await prisma.conversationParticipant.findMany({
      where: { userId },
      include: {
        conversation: {
          include: {
            participants: {
              include: {
                user: { select: { id: true, name: true, username: true, avatar: true } },
              },
            },
            messages: {
              take: 1,
              orderBy: { createdAt: "desc" },
              include: {
                sender: { select: { id: true, name: true, username: true, avatar: true } },
              },
            },
            _count: { select: { messages: true } },
          },
        },
      },
      orderBy: { conversation: { updatedAt: "desc" } },
    });

    return participations.map((p) => {
      const conv = p.conversation;
      const unreadCount = conv.messages.filter(
        (m) =>
          m.senderId !== userId &&
          (!p.lastReadAt || new Date(m.createdAt) > new Date(p.lastReadAt)),
      ).length;

      return {
        id: conv.id,
        isGroup: conv.isGroup,
        groupName: conv.groupName,
        groupAvatar: conv.groupAvatar,
        participants: conv.participants,
        lastMessage: conv.messages[0] ?? null,
        unreadCount,
        isMuted: p.isMuted,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
      };
    });
  },

  async getTotalUnreadCount(userId: string) {
    const participations = await prisma.conversationParticipant.findMany({
      where: { userId },
      include: {
        conversation: {
          include: {
            messages: {
              take: 1,
              orderBy: { createdAt: "desc" },
              select: { id: true, senderId: true, createdAt: true },
            },
          },
        },
      },
    });

    let total = 0;
    for (const p of participations) {
      const conv = p.conversation;
      const unread = conv.messages.filter(
        (m) =>
          m.senderId !== userId &&
          (!p.lastReadAt || new Date(m.createdAt) > new Date(p.lastReadAt)),
      ).length;
      total += unread;
    }
    return total;
  },

  async createConversation(
    userId: string,
    participantIds: string[],
    isGroup?: boolean,
    groupName?: string,
  ) {
    const allIds = [...new Set([userId, ...participantIds])];

    if (!isGroup && allIds.length === 2) {
      const existing = await prisma.conversation.findFirst({
        where: {
          isGroup: false,
          participants: {
            every: { userId: { in: allIds } },
          },
        },
        include: {
          participants: {
            include: {
              user: { select: { id: true, name: true, username: true, avatar: true } },
            },
          },
        },
      });

      if (existing) return existing;
    }

    return prisma.conversation.create({
      data: {
        isGroup: isGroup ?? false,
        groupName,
        participants: {
          createMany: {
            data: allIds.map((id) => ({
              userId: id,
              role: id === userId ? "ADMIN" : "MEMBER",
            })),
          },
        },
      },
      include: {
        participants: {
          include: {
            user: { select: { id: true, name: true, username: true, avatar: true } },
          },
        },
      },
    });
  },

  async getConversation(conversationId: string, userId: string, cursor?: string, limit = 50) {
    const participant = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!participant) throw new AppError(403, "Not a participant of this conversation");

    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        isDeleted: false,
        NOT: { deletedFor: { has: userId } },
      },
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      include: {
        sender: { select: { id: true, name: true, username: true, avatar: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const hasMore = messages.length > limit;
    const items = hasMore ? messages.slice(0, limit) : messages;

    return {
      messages: items.reverse(),
      nextCursor: hasMore ? items[0]?.id : null,
      hasMore,
    };
  },

  async sendMessage(
    conversationId: string,
    senderId: string,
    data: {
      content?: string;
      mediaUrl?: string;
      sharedPostId?: string;
      messageType?: string;
      storyId?: string;
      storyReplyData?: Record<string, unknown>;
    },
  ) {
    await prisma.conversationParticipant.findUniqueOrThrow({
      where: { conversationId_userId: { conversationId, userId: senderId } },
    });

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId,
        content: data.content,
        mediaUrl: data.mediaUrl,
        sharedPostId: data.sharedPostId,
        messageType: data.messageType ?? "text",
        storyId: data.storyId,
        storyReplyData: (data.storyReplyData ?? undefined) as Prisma.InputJsonValue,
      },
      include: {
        sender: { select: { id: true, name: true, username: true, avatar: true } },
      },
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    try {
      const channel = supabase.channel(`room:${conversationId}:messages`);
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
      await channel.send({
        type: "broadcast",
        event: "INSERT",
        payload: { ...message, senderName: message.sender?.name ?? "Unknown" },
      });
      channel.unsubscribe();
    } catch {}

    try {
      const participants = await prisma.conversationParticipant.findMany({
        where: { conversationId, userId: { not: senderId } },
        select: { userId: true },
      });
      for (const p of participants) {
        try {
          await notificationService.create({
            type: "MESSAGE",
            userId: p.userId,
            fromUserId: senderId,
            message: data.content?.slice(0, 100),
          });
        } catch {}
      }
    } catch {}

    return message;
  },

  async deleteMessage(messageId: string, userId: string, deleteForAll = false) {
    const message = await prisma.message.findUniqueOrThrow({ where: { id: messageId } })

    if (message.senderId !== userId) {
      throw new AppError(403, "Not your message")
    }

    if (deleteForAll) {
      await prisma.message.update({
        where: { id: messageId },
        data: { isDeleted: true },
      })
    } else {
      const deletedFor = [...message.deletedFor, userId]
      if (deletedFor.length >= 2) {
        await prisma.message.update({
          where: { id: messageId },
          data: { isDeleted: true },
        })
      } else {
        await prisma.message.update({
          where: { id: messageId },
          data: { deletedFor },
        })
      }
    }
  },

  async toggleMute(conversationId: string, userId: string) {
    const participant = await prisma.conversationParticipant.findUniqueOrThrow({
      where: { conversationId_userId: { conversationId, userId } },
    });

    return prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { isMuted: !participant.isMuted },
    });
  },

  async markRead(conversationId: string, userId: string) {
    return prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { lastReadAt: new Date() },
    });
  },

  async deleteConversation(conversationId: string, userId: string, deleteForEveryone = false) {
    const participant = await prisma.conversationParticipant.findUniqueOrThrow({
      where: { conversationId_userId: { conversationId, userId } },
    });

    const conv = await prisma.conversation.findUniqueOrThrow({
      where: { id: conversationId },
      select: { isGroup: true },
    });

    if (conv.isGroup) {
      if (deleteForEveryone) {
        if (participant.role !== "ADMIN") throw new AppError(403, "Only admins can delete the group");
        await prisma.conversation.delete({ where: { id: conversationId } });
        return;
      }

      const adminCount = await prisma.conversationParticipant.count({
        where: { conversationId, role: "ADMIN" },
      });
      if (adminCount === 1 && participant.role === "ADMIN") {
        throw new AppError(400, "Assign another admin before leaving");
      }
    }

    await prisma.conversationParticipant.delete({
      where: { conversationId_userId: { conversationId, userId } },
    });

    const remaining = await prisma.conversationParticipant.count({ where: { conversationId } });
    if (remaining === 0) {
      await prisma.conversation.delete({ where: { id: conversationId } });
    }
  },

  async clearMessages(conversationId: string, userId: string) {
    await prisma.conversationParticipant.findUniqueOrThrow({
      where: { conversationId_userId: { conversationId, userId } },
    });

    await prisma.message.updateMany({
      where: { conversationId, isDeleted: false },
      data: { isDeleted: true },
    });
  },

  async addParticipant(conversationId: string, newUserId: string, currentUserId: string) {
    await prisma.conversationParticipant.findUniqueOrThrow({
      where: { conversationId_userId: { conversationId, userId: currentUserId } },
    });

    const conv = await prisma.conversation.findUniqueOrThrow({
      where: { id: conversationId },
      select: { isGroup: true },
    });
    if (!conv.isGroup) throw new AppError(400, "Cannot add participants to a direct conversation");

    const existing = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId: newUserId } },
    });
    if (existing) throw new AppError(409, "User is already a participant");

    return prisma.conversationParticipant.create({
      data: { conversationId, userId: newUserId },
      include: { user: { select: { id: true, name: true, username: true, avatar: true } } },
    });
  },

  async removeParticipant(conversationId: string, userIdToRemove: string, currentUserId: string) {
    const current = await prisma.conversationParticipant.findUniqueOrThrow({
      where: { conversationId_userId: { conversationId, userId: currentUserId } },
    });

    const isSelfRemove = currentUserId === userIdToRemove;
    const isAdmin = current.role === "ADMIN";

    if (!isSelfRemove && !isAdmin) {
      throw new AppError(403, "Only admins can remove other participants");
    }

    const target = await prisma.conversationParticipant.findUniqueOrThrow({
      where: { conversationId_userId: { conversationId, userId: userIdToRemove } },
    });

    if (target.role === "ADMIN" && !isSelfRemove) {
      throw new AppError(403, "Cannot remove an admin");
    }

    await prisma.conversationParticipant.delete({
      where: { conversationId_userId: { conversationId, userId: userIdToRemove } },
    });

    const remaining = await prisma.conversationParticipant.count({ where: { conversationId } });
    if (remaining === 0) {
      await prisma.conversation.delete({ where: { id: conversationId } });
    }
  },

  async promoteToAdmin(conversationId: string, targetUserId: string, currentUserId: string) {
    const current = await prisma.conversationParticipant.findUniqueOrThrow({
      where: { conversationId_userId: { conversationId, userId: currentUserId } },
    });
    if (current.role !== "ADMIN") throw new AppError(403, "Only admins can promote members");

    const target = await prisma.conversationParticipant.findUniqueOrThrow({
      where: { conversationId_userId: { conversationId, userId: targetUserId } },
    });

    return prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId: targetUserId } },
      data: { role: "ADMIN" },
    });
  },

  async updateGroupInfo(
    conversationId: string,
    data: { groupName?: string; groupAvatar?: string },
    userId: string,
  ) {
    const participant = await prisma.conversationParticipant.findUniqueOrThrow({
      where: { conversationId_userId: { conversationId, userId } },
    });

    const conv = await prisma.conversation.findUniqueOrThrow({
      where: { id: conversationId },
      select: { isGroup: true },
    });
    if (!conv.isGroup) throw new AppError(400, "Not a group conversation");

    return prisma.conversation.update({
      where: { id: conversationId },
      data,
      include: {
        participants: {
          include: {
            user: { select: { id: true, name: true, username: true, avatar: true } },
          },
        },
      },
    });
  },
};
