import { prisma } from "../lib/prisma";
import { AppError } from "../utils/AppError";
import { notificationService } from "./notification.service";
import { notifyMentions } from "../utils/mentions";

export const commentService = {
  async getByPost(postId: string, cursor?: string, limit = 20) {
    const comments = await prisma.comment.findMany({
      where: { postId, parentId: null },
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      include: {
        user: { select: { id: true, name: true, username: true, avatar: true, isVerified: true } },
        replies: {
          take: 2,
          orderBy: { createdAt: "asc" },
          include: {
            user: {
              select: { id: true, name: true, username: true, avatar: true, isVerified: true },
            },
          },
        },
        _count: { select: { replies: true } },
      },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    });

    const hasMore = comments.length > limit;
    const items = hasMore ? comments.slice(0, limit) : comments;

    return {
      comments: items,
      nextCursor: hasMore ? items[items.length - 1]?.id : null,
      hasMore,
    };
  },

  async create(postId: string, userId: string, content: string, parentId?: string) {
    const comment = await prisma.comment.create({
      data: { content, postId, userId, parentId },
      include: {
        user: { select: { id: true, name: true, username: true, avatar: true, isVerified: true } },
      },
    });

    const post = await prisma.post.findUnique({ where: { id: postId }, select: { userId: true } });
    if (post && post.userId !== userId) {
      if (parentId) {
        const parent = await prisma.comment.findUnique({
          where: { id: parentId },
          select: { userId: true },
        });
        if (parent && parent.userId !== userId) {
          notificationService
            .create({
              type: "COMMENT_REPLY",
              userId: parent.userId,
              fromUserId: userId,
              postId,
              commentId: comment.id,
            })
            .catch(() => {});
        }
      } else {
        notificationService
          .create({
            type: "POST_COMMENT",
            userId: post.userId,
            fromUserId: userId,
            postId,
            commentId: comment.id,
          })
          .catch(() => {});
      }
    }

    notifyMentions(content, userId, postId, comment.id).catch(() => {});

    return comment;
  },

  async update(commentId: string, userId: string, content: string) {
    const existing = await prisma.comment.findFirst({ where: { id: commentId, userId } });
    if (!existing) throw new AppError(404, "Comment not found or not owned by user");
    return prisma.comment.update({
      where: { id: commentId },
      data: { content },
      include: {
        user: { select: { id: true, name: true, username: true, avatar: true, isVerified: true } },
      },
    });
  },

  async delete(commentId: string, userId: string) {
    const existing = await prisma.comment.findFirst({ where: { id: commentId, userId } });
    if (!existing) throw new AppError(404, "Comment not found or not owned by user");
    await prisma.comment.delete({ where: { id: commentId } });
  },

  async togglePin(commentId: string) {
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) return null;
    return prisma.comment.update({
      where: { id: commentId },
      data: { isPinned: !comment.isPinned },
    });
  },
};
