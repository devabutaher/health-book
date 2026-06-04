import { prisma } from "../lib/prisma";
import { AppError } from "../utils/AppError";

export const storyService = {
  async create(data: {
    userId: string;
    type?: "media" | "text" | "quiz" | "poll";
    privacy?: "public" | "friends" | "private";
    mediaUrl?: string;
    mediaType?: "image" | "video";
    duration?: number;
    textOverlay?: string;
    textColor?: string;
    textFontSize?: number;
    textFontWeight?: string;
    textPosition?: string;
    backgroundColor?: string;
    stickerData?: {
      type: "quiz" | "poll";
      question?: string;
      options?: string[];
      correctOptionIndex?: number;
      backgroundColor?: string;
    };
  }) {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    return prisma.story.create({
      data: {
        userId: data.userId,
        type: data.type ?? "media",
        privacy: data.privacy ?? "friends",
        mediaUrl: data.mediaUrl,
        mediaType: data.mediaType,
        duration: data.duration,
        textOverlay: data.textOverlay,
        textColor: data.textColor,
        textFontSize: data.textFontSize,
        textFontWeight: data.textFontWeight,
        textPosition: data.textPosition,
        backgroundColor: data.backgroundColor,
        stickerData: data.stickerData ?? undefined,
        expiresAt,
      },
      include: {
        user: { select: { id: true, name: true, username: true, avatar: true } },
      },
    });
  },

  async getFriendsStories(userId: string) {
    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    const followingIds = [...following.map((f) => f.followingId), userId];

    const now = new Date();

    const stories = await prisma.story.findMany({
      where: {
        userId: { in: followingIds },
        expiresAt: { gt: now },
      },
      include: {
        user: { select: { id: true, name: true, username: true, avatar: true } },
        views: {
          where: { userId },
          select: { viewedAt: true },
        },
        likes: {
          where: { userId },
          select: { createdAt: true },
        },
        reactions: {
          where: { userId },
          select: { emoji: true },
        },
        _count: { select: { likes: true, reactions: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const grouped: Record<string, { user: (typeof stories)[0]["user"]; stories: unknown[] }> = {};
    for (const story of stories) {
      // Skip private stories from other users
      if (story.privacy === "private" && story.userId !== userId) continue;

      if (!grouped[story.userId]) {
        grouped[story.userId] = { user: story.user, stories: [] };
      }
      grouped[story.userId].stories.push({
        id: story.id,
        userId: story.userId,
        type: story.type,
        privacy: story.privacy,
        mediaUrl: story.mediaUrl,
        mediaType: story.mediaType,
        duration: story.duration,
        textOverlay: story.textOverlay,
        textColor: story.textColor,
        textFontSize: story.textFontSize,
        textFontWeight: story.textFontWeight,
        textPosition: story.textPosition,
        backgroundColor: story.backgroundColor,
        stickerData: story.stickerData,
        expiresAt: story.expiresAt,
        createdAt: story.createdAt,
        viewed: story.views.length > 0,
        liked: story.likes.length > 0,
        likeCount: story._count.likes,
        reaction: story.reactions[0]?.emoji ?? null,
        reactionCount: story._count.reactions,
      });
    }

    return Object.values(grouped);
  },

  async addView(storyId: string, userId: string) {
    const story = await prisma.story.findUniqueOrThrow({ where: { id: storyId } });

    if (story.userId === userId) return { viewed: true };

    await prisma.storyView.upsert({
      where: { storyId_userId: { storyId, userId } },
      create: { storyId, userId },
      update: {},
    });
    return { viewed: true };
  },

  async toggleLike(storyId: string, userId: string) {
    const story = await prisma.story.findUniqueOrThrow({ where: { id: storyId } });

    const existing = await prisma.storyLike.findUnique({
      where: { storyId_userId: { storyId, userId } },
    });

    if (existing) {
      await prisma.storyLike.delete({ where: { storyId_userId: { storyId, userId } } });
      return { liked: false };
    }

    await prisma.storyLike.create({ data: { storyId, userId } });
    return { liked: true };
  },

  async react(storyId: string, userId: string, emoji: string) {
    const story = await prisma.story.findUniqueOrThrow({ where: { id: storyId } });

    const existing = await prisma.storyReaction.findUnique({
      where: { storyId_userId: { storyId, userId } },
    });

    if (existing) {
      if (existing.emoji === emoji) {
        // Same emoji — remove reaction (toggle off)
        await prisma.storyReaction.delete({ where: { storyId_userId: { storyId, userId } } });
        return { reacted: false, emoji: null };
      }
      // Different emoji — update
      await prisma.storyReaction.update({
        where: { storyId_userId: { storyId, userId } },
        data: { emoji },
      });
      return { reacted: true, emoji };
    }

    await prisma.storyReaction.create({ data: { storyId, userId, emoji } });
    return { reacted: true, emoji };
  },

  async getReactions(storyId: string) {
    const reactions = await prisma.storyReaction.findMany({
      where: { storyId },
      include: {
        user: { select: { id: true, name: true, username: true, avatar: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return reactions.map((r) => ({
      userId: r.userId,
      user: r.user,
      emoji: r.emoji,
      createdAt: r.createdAt,
    }));
  },

  async getViews(storyId: string) {
    const views = await prisma.storyView.findMany({
      where: { storyId },
      include: {
        user: { select: { id: true, name: true, username: true, avatar: true } },
      },
      orderBy: { viewedAt: "desc" },
    });
    return views.map((v) => ({ userId: v.userId, user: v.user, viewedAt: v.viewedAt }));
  },

  async delete(storyId: string, userId: string) {
    const story = await prisma.story.findUniqueOrThrow({ where: { id: storyId } });
    if (story.userId !== userId) throw new AppError(403, "Not your story");

    await prisma.story.delete({ where: { id: storyId } });
  },

  async cleanupExpired() {
    await prisma.story.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  },

  async votePoll(storyId: string, userId: string, optionIndex: number) {
    const story = await prisma.story.findUniqueOrThrow({ where: { id: storyId } });

    if (
      !story.stickerData ||
      !["poll", "quiz"].includes((story.stickerData as { type: string }).type)
    ) {
      throw new AppError(400, "Story does not have a poll or quiz");
    }

    const sticker = story.stickerData as {
      type: string;
      question?: string;
      options: string[];
      correctOptionIndex?: number;
    };

    if (optionIndex < 0 || optionIndex >= (sticker.options?.length ?? 0)) {
      throw new AppError(400, "Invalid option");
    }

    await prisma.storyPollVote.upsert({
      where: { storyId_userId: { storyId, userId } },
      create: { storyId, userId, optionIndex },
      update: { optionIndex },
    });

    return this.getPollResults(storyId, userId);
  },

  async getPollResults(storyId: string, userId?: string) {
    const story = await prisma.story.findUniqueOrThrow({
      where: { id: storyId },
      include: {
        pollVotes: { select: { optionIndex: true, userId: true } },
      },
    });

    if (
      !story.stickerData ||
      !["poll", "quiz"].includes((story.stickerData as { type: string }).type)
    ) {
      throw new AppError(400, "Story does not have a poll or quiz");
    }

    const sticker = story.stickerData as {
      type: string;
      question?: string;
      options: string[];
      correctOptionIndex?: number;
    };
    const totalVotes = story.pollVotes.length;
    const optionCounts = (sticker.options ?? []).map((_, idx) => ({
      optionIndex: idx,
      count: story.pollVotes.filter((v) => v.optionIndex === idx).length,
    }));

    let userVote: { optionIndex: number } | null = null;
    if (userId) {
      userVote = story.pollVotes.find((v) => v.userId === userId) ?? null;
    }

    return {
      question: sticker.question,
      options: sticker.options,
      votes: optionCounts,
      totalVotes,
      correctOptionIndex: sticker.type === "quiz" ? sticker.correctOptionIndex : undefined,
      userVote: userVote ? { optionIndex: userVote.optionIndex } : null,
    };
  },
};
