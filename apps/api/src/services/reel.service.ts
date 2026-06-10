import { prisma } from "../lib/prisma";
import { AppError } from "../utils/AppError";
import { broadcastRealtime } from "../utils/realtime";
import { deleteImage, deleteVideo, extractPublicId } from "./cloudinary";

export const reelService = {
  async browse(cursor?: string, limit = 10, userId?: string) {
    const reels = await prisma.reel.findMany({
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      include: {
        user: { select: { id: true, name: true, username: true, avatar: true } },
        _count: { select: { likes: true, comments: true } },
        ...(userId ? { likes: { where: { userId }, take: 1 } } : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    const hasMore = reels.length > limit;
    const items = hasMore ? reels.slice(0, limit) : reels;

    const reelUserIds = items.map((r) => r.userId);
    let followingMap: Record<string, boolean> = {};
    if (userId) {
      const follows = await prisma.follow.findMany({
        where: { followerId: userId, followingId: { in: reelUserIds } },
        select: { followingId: true },
      });
      for (const f of follows) followingMap[f.followingId] = true;
    }

    return {
      reels: items.map((r) => ({
        id: r.id,
        videoUrl: r.videoUrl,
        caption: r.caption,
        thumbnailUrl: r.thumbnailUrl,
        user: { ...r.user, isFollowing: userId ? !!followingMap[r.userId] : false },
        likesCount: r._count.likes,
        commentsCount: r._count.comments,
        isLiked: userId ? Array.isArray(r.likes) && r.likes.length > 0 : false,
        createdAt: r.createdAt,
      })),
      nextCursor: hasMore ? items[items.length - 1]?.id : null,
      hasMore,
    };
  },

  async getById(reelId: string, userId?: string) {
    const reel = await prisma.reel.findUniqueOrThrow({
      where: { id: reelId },
      include: {
        user: { select: { id: true, name: true, username: true, avatar: true } },
        _count: { select: { likes: true, comments: true } },
        likes: userId ? { where: { userId }, take: 1 } : false,
        comments: {
          include: {
            user: { select: { id: true, name: true, username: true, avatar: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 50,
        },
      },
    });

    let isFollowing = false;
    if (userId) {
      const follow = await prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: userId, followingId: reel.userId } },
        select: { followingId: true },
      });
      isFollowing = !!follow;
    }

    return {
      id: reel.id,
      videoUrl: reel.videoUrl,
      caption: reel.caption,
      thumbnailUrl: reel.thumbnailUrl,
      user: { ...reel.user, isFollowing },
      likesCount: reel._count.likes,
      commentsCount: reel._count.comments,
      isLiked: Array.isArray(reel.likes) ? reel.likes.length > 0 : false,
      comments: reel.comments,
      createdAt: reel.createdAt,
    };
  },

  async create(data: {
    videoUrl: string;
    caption?: string;
    thumbnailUrl?: string;
    userId: string;
  }) {
    const reel = await prisma.reel.create({
      data,
      include: {
        user: { select: { id: true, name: true, username: true, avatar: true } },
      },
    });

    broadcastRealtime(`hb-reel:${reel.id}`, "REEL_CREATED", {
      reelId: reel.id,
      userId: data.userId,
    }).catch(() => {});

    return reel;
  },

  async toggleLike(reelId: string, userId: string) {
    const existing = await prisma.reelLike.findUnique({
      where: { reelId_userId: { reelId, userId } },
    });

    if (existing) {
      await prisma.reelLike.delete({ where: { reelId_userId: { reelId, userId } } });
      broadcastRealtime(`hb-reel:${reelId}`, "REEL_UNLIKED", { reelId, userId }).catch(() => {});
      return { liked: false };
    }

    await prisma.reelLike.create({ data: { reelId, userId } });
    broadcastRealtime(`hb-reel:${reelId}`, "REEL_LIKED", { reelId, userId }).catch(() => {});
    return { liked: true };
  },

  async addComment(reelId: string, userId: string, content: string) {
    const comment = await prisma.reelComment.create({
      data: { content, reelId, userId },
      include: {
        user: { select: { id: true, name: true, username: true, avatar: true } },
      },
    });

    broadcastRealtime(`hb-reel:${reelId}`, "REEL_COMMENTED", {
      commentId: comment.id,
      reelId,
      userId,
    }).catch(() => {});

    return comment;
  },

  async deleteComment(commentId: string, userId: string) {
    const comment = await prisma.reelComment.findUniqueOrThrow({ where: { id: commentId } });
    if (comment.userId !== userId) throw new AppError(403, "Not your comment");

    await prisma.reelComment.delete({ where: { id: commentId } });

    broadcastRealtime(`hb-reel:${comment.reelId}`, "REEL_COMMENT_DELETED", {
      reelId: comment.reelId,
      commentId,
    }).catch(() => {});
  },

  async update(reelId: string, userId: string, data: { caption?: string }) {
    const reel = await prisma.reel.findUniqueOrThrow({ where: { id: reelId } });
    if (reel.userId !== userId) throw new AppError(403, "Not your reel");

    const updated = await prisma.reel.update({
      where: { id: reelId },
      data,
      include: {
        user: { select: { id: true, name: true, username: true, avatar: true } },
        _count: { select: { likes: true, comments: true } },
        likes: { where: { userId }, take: 1 },
        comments: {
          include: {
            user: { select: { id: true, name: true, username: true, avatar: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 50,
        },
      },
    });

    broadcastRealtime(`hb-reel:${reelId}`, "REEL_UPDATED", {
      reelId,
    }).catch(() => {});

    return updated;
  },

  async delete(reelId: string, userId: string) {
    const reel = await prisma.reel.findUniqueOrThrow({ where: { id: reelId } });
    if (reel.userId !== userId) throw new AppError(403, "Not your reel");
    if (reel.videoUrl) {
      const publicId = extractPublicId(reel.videoUrl);
      if (publicId) deleteVideo(publicId).catch(() => {});
    }
    if (reel.thumbnailUrl) {
      const publicId = extractPublicId(reel.thumbnailUrl);
      if (publicId) deleteImage(publicId).catch(() => {});
    }
    await prisma.reel.delete({ where: { id: reelId } });

    broadcastRealtime(`hb-reel:${reelId}`, "REEL_DELETED", {
      reelId,
    }).catch(() => {});
  },
};
