import { prisma } from "../lib/prisma";
import { notificationService } from "./notification.service";
import { messageService } from "./message.service";

const calcStreak = (logDates: Set<string>): number => {
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    if (logDates.has(key)) streak++;
    else break;
  }
  return streak;
};

export const userService = {
  async getProfile(username: string, currentUserId?: string) {
    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        _count: { select: { posts: true, followers: true, following: true } },
      },
    });

    if (!user) return null;

    let isFollowing = false;
    if (currentUserId) {
      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUserId,
            followingId: user.id,
          },
        },
      });
      isFollowing = !!follow;
    }

    const recentLogs = await prisma.healthLog.findMany({
      where: { userId: user.id, isPublic: true },
      select: { date: true, score: true },
      orderBy: { date: "desc" },
      take: 100,
    });
    const logDates = new Set(recentLogs.map((l) => l.date.toISOString().split("T")[0]));
    const streak = calcStreak(logDates);
    const avgScore =
      recentLogs.length > 0
        ? Math.round(recentLogs.reduce((s, l) => s + (l.score || 0), 0) / recentLogs.length)
        : 0;

    return {
      id: user.id,
      username: user.username,
      name: user.name,
      bio: user.bio,
      avatar: user.avatar,
      coverPhoto: user.coverPhoto,
      isVerified: user.isVerified,
      role: user.role,
      isFollowing,
      streak,
      healthScore: avgScore,
      _count: user._count,
      createdAt: user.createdAt,
    };
  },

  async updateProfile(userId: string, data: { name?: string; bio?: string; isPrivate?: boolean }) {
    return prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        bio: true,
        avatar: true,
        coverPhoto: true,
        role: true,
        isVerified: true,
        isPrivate: true,
        createdAt: true,
      },
    });
  },

  async updateAvatar(userId: string, avatar: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { avatar },
      select: { id: true, avatar: true },
    });
  },

  async updateCover(userId: string, coverPhoto: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { coverPhoto },
      select: { id: true, coverPhoto: true },
    });
  },

  async follow(followerId: string, followingId: string) {
    await prisma.follow.create({
      data: { followerId, followingId },
    });

    if (followerId !== followingId) {
      notificationService
        .create({
          type: "NEW_FOLLOWER",
          userId: followingId,
          fromUserId: followerId,
        })
        .catch(() => {});

      messageService.createConversation(followerId, [followingId]).catch(() => {});
    }
  },

  async unfollow(followerId: string, followingId: string) {
    await prisma.follow.delete({
      where: {
        followerId_followingId: { followerId, followingId },
      },
    });
  },

  async getSuggested(currentUserId: string, limit = 5) {
    const users = await prisma.user.findMany({
      where: {
        id: { not: currentUserId },
        followers: { none: { followerId: currentUserId } },
      },
      take: limit,
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, username: true, avatar: true, isVerified: true },
    });
    return users;
  },

  async getFollowers(currentUserId: string, userId: string, cursor?: string, limit = 20) {
    const follows = await prisma.follow.findMany({
      where: { followingId: userId },
      take: limit + 1,
      ...(cursor
        ? {
            skip: 1,
            cursor: { followerId_followingId: { followerId: cursor, followingId: userId } },
          }
        : {}),
      include: {
        follower: {
          select: { id: true, name: true, username: true, avatar: true, isVerified: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const hasMore = follows.length > limit;
    const items = hasMore ? follows.slice(0, limit) : follows;

    const followerIds = items.map((f) => f.follower.id);
    const existingFollows =
      currentUserId !== userId
        ? await prisma.follow.findMany({
            where: {
              followerId: currentUserId,
              followingId: { in: followerIds },
            },
            select: { followingId: true },
          })
        : [];
    const followingSet = new Set(existingFollows.map((f) => f.followingId));

    const users = items.map((f) => ({
      ...f.follower,
      isFollowing: currentUserId === f.follower.id ? false : followingSet.has(f.follower.id),
    }));

    return {
      users,
      nextCursor: hasMore ? items[items.length - 1]?.followerId : null,
      hasMore,
    };
  },

  async getFollowing(currentUserId: string, userId: string, cursor?: string, limit = 20) {
    const follows = await prisma.follow.findMany({
      where: { followerId: userId },
      take: limit + 1,
      ...(cursor
        ? {
            skip: 1,
            cursor: { followerId_followingId: { followerId: userId, followingId: cursor } },
          }
        : {}),
      include: {
        following: {
          select: { id: true, name: true, username: true, avatar: true, isVerified: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const hasMore = follows.length > limit;
    const items = hasMore ? follows.slice(0, limit) : follows;

    const users = items.map((f) => ({
      ...f.following,
      isFollowing: true,
    }));

    return {
      users,
      nextCursor: hasMore ? items[items.length - 1]?.followingId : null,
      hasMore,
    };
  },
};
