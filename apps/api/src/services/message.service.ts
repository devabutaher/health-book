import { prisma } from "../lib/prisma";
import { Prisma } from "../../generated/prisma";
import { AppError } from "../utils/AppError";
import { broadcastRealtime } from "../utils/realtime";
import { notificationService } from "./notification.service";

export const messageService = {
  async listConversations(userId: string, cursor?: string, limit = 50) {
    const participations = await prisma.conversationParticipant.findMany({
      where: { userId },
      take: limit + 1,
      ...(cursor
        ? { skip: 1, cursor: { conversationId_userId: { conversationId: cursor, userId } } }
        : {}),
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
          },
        },
      },
      orderBy: [{ conversation: { updatedAt: "desc" } }, { conversationId: "desc" }],
    });

    const hasMore = participations.length > limit;
    const items = hasMore ? participations.slice(0, limit) : participations;

    const data = items.map((p) => {
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

    return { data, nextCursor: hasMore ? (data[data.length - 1]?.id ?? null) : null, hasMore };
  },

  async getTotalUnreadCount(userId: string) {
    const result = await prisma.conversationParticipant.findMany({
      where: { userId },
      select: {
        lastReadAt: true,
        conversation: {
          select: {
            messages: {
              where: { senderId: { not: userId }, isDeleted: false },
              orderBy: { createdAt: "desc" },
              take: 1,
              select: { createdAt: true },
            },
          },
        },
      },
      take: 100,
    });

    return result.filter((p) => {
      const lastMsg = p.conversation.messages[0];
      return lastMsg && (!p.lastReadAt || new Date(lastMsg.createdAt) > new Date(p.lastReadAt));
    }).length;
  },

  async createConversation(
    userId: string,
    participantIds: string[],
    isGroup?: boolean,
    groupName?: string,
  ) {
    const allIds = [...new Set([userId, ...participantIds])];

    const include = {
      participants: {
        include: {
          user: { select: { id: true, name: true, username: true, avatar: true } },
        },
      },
    } as const;

    // For 1-on-1, use directKey unique constraint to prevent duplicates
    if (!isGroup && allIds.length === 2) {
      const [a, b] = [...allIds].sort();
      const directKey = `${a}:${b}`;

      const existing = await prisma.conversation.findUnique({
        where: { directKey },
        include,
      });
      if (existing) return existing;

      try {
        const created = await prisma.conversation.create({
          data: {
            isGroup: false,
            directKey,
            participants: {
              createMany: {
                data: allIds.map((id) => ({
                  userId: id,
                  role: id === userId ? "ADMIN" : "MEMBER",
                })),
              },
            },
          },
          include,
        });
        return created;
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
          const existing = await prisma.conversation.findUnique({
            where: { directKey },
            include,
          });
          if (existing) return existing;
        }
        throw err;
      }
    }

    const conversation = await prisma.conversation.create({
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
      include,
    });

    await Promise.allSettled(
      allIds.map((id) =>
        broadcastRealtime(`hb-conversations:${id}`, "CONVERSATION_CREATED", {
          conversationId: conversation.id,
        }).catch(() => {}),
      ),
    );

    return conversation;
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

    const message = await prisma.$transaction(async (tx) => {
      const msg = await tx.message.create({
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

      await tx.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });

      return msg;
    });

    broadcastRealtime(`room:${conversationId}:messages`, "INSERT", {
      ...message,
      senderName: message.sender?.name ?? "Unknown",
    }).catch((err) => {
      console.error(`[message] realtime broadcast failed for ${conversationId}`, err);
    });

    let participants: { userId: string }[] = [];
    try {
      participants = await prisma.conversationParticipant.findMany({
        where: { conversationId, userId: { not: senderId } },
        select: { userId: true },
      });
    } catch (err) {
      console.error(`[message] participant fetch failed for ${conversationId}`, err);
    }

    await Promise.allSettled(
      participants.map((p) =>
        broadcastRealtime(`hb-conversations:${p.userId}`, "CONVERSATION_UPDATED", {
          conversationId,
        }).catch((err) => {
          console.error(`[message] conversation list broadcast failed for ${conversationId}`, err);
        }),
      ),
    );

    // Batch create notifications via createMany — single DB write instead of N sequential
    try {
      await prisma.notification.createMany({
        data: participants.map((p) => ({
          type: "MESSAGE",
          userId: p.userId,
          fromUserId: senderId,
          message: data.content?.slice(0, 100),
        })),
      });
    } catch (err) {
      console.error(`[message] batch notification create failed`, err);
    }

    // Broadcast realtime in parallel
    await Promise.allSettled(
      participants.map((p) =>
        broadcastRealtime(`hb-notification:${p.userId}`, "INSERT", {
          type: "MESSAGE",
          userId: p.userId,
          fromUserId: senderId,
          message: data.content?.slice(0, 100),
        }).catch((err) =>
          console.error(`[message] notification broadcast failed for ${p.userId}`, err),
        ),
      ),
    );

    return message;
  },

  async deleteMessage(messageId: string, userId: string, deleteForAll = false) {
    const message = await prisma.message.findUniqueOrThrow({ where: { id: messageId } });

    if (message.senderId !== userId) {
      throw new AppError(403, "Not your message");
    }

    if (deleteForAll) {
      await prisma.message.update({
        where: { id: messageId },
        data: { isDeleted: true },
      });
    } else {
      const deletedFor = [...message.deletedFor, userId];
      if (deletedFor.length >= 2) {
        await prisma.message.update({
          where: { id: messageId },
          data: { isDeleted: true },
        });
      } else {
        await prisma.message.update({
          where: { id: messageId },
          data: { deletedFor },
        });
      }
    }

    broadcastRealtime(`room:${message.conversationId}:messages`, "MESSAGE_DELETED", {
      messageId,
      conversationId: message.conversationId,
      userId,
    }).catch(() => {});
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
        if (participant.role !== "ADMIN")
          throw new AppError(403, "Only admins can delete the group");
        await prisma.conversation.delete({ where: { id: conversationId } });

        const allParticipants = await prisma.conversationParticipant.findMany({
          where: { conversationId },
          select: { userId: true },
        });
        await Promise.allSettled(
          allParticipants.map((p) =>
            broadcastRealtime(`hb-conversations:${p.userId}`, "CONVERSATION_DELETED", {
              conversationId,
            }).catch(() => {}),
          ),
        );
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

    broadcastRealtime(`room:${conversationId}:messages`, "PARTICIPANT_REMOVED", {
      conversationId,
      userId,
    }).catch(() => {});

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

    broadcastRealtime(`room:${conversationId}:messages`, "MESSAGES_CLEARED", {
      conversationId,
      userId,
    }).catch(() => {});
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

    const participant = await prisma.conversationParticipant.create({
      data: { conversationId, userId: newUserId },
      include: { user: { select: { id: true, name: true, username: true, avatar: true } } },
    });

    broadcastRealtime(`room:${conversationId}:messages`, "PARTICIPANT_ADDED", {
      conversationId,
      userId: newUserId,
    }).catch(() => {});

    return participant;
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

    broadcastRealtime(`room:${conversationId}:messages`, "PARTICIPANT_REMOVED", {
      conversationId,
      userId: userIdToRemove,
    }).catch(() => {});

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

    const result = await prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId: targetUserId } },
      data: { role: "ADMIN" },
    });

    broadcastRealtime(`room:${conversationId}:messages`, "ADMIN_PROMOTED", {
      conversationId,
      userId: targetUserId,
    }).catch(() => {});

    return result;
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

    const updated = await prisma.conversation.update({
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

    broadcastRealtime(`room:${conversationId}:messages`, "GROUP_INFO_UPDATED", {
      conversationId,
      groupName: data.groupName,
      groupAvatar: data.groupAvatar,
    }).catch(() => {});

    return updated;
  },
};
