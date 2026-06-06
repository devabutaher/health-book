import { prisma } from "../lib/prisma";
import { AppError } from "../utils/AppError";
import { deleteImage, extractPublicId } from "./cloudinary";

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
    textBgColor?: string;
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
        textBgColor: data.textBgColor,
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
        expiresAt: { gt: now },
        OR: [
          { userId: { in: followingIds } },
          { privacy: "public" },
        ],
      },
      include: {
        user: { select: { id: true, name: true, username: true, avatar: true } },
        views: {
          where: { userId },
          select: { viewedAt: true },
        },
        reactions: {
          where: { userId },
          select: { emoji: true },
        },
        _count: { select: { reactions: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const grouped: Record<string, { user: (typeof stories)[0]["user"]; stories: unknown[] }> = {};
    for (const story of stories) {
      // Skip private stories from other users
      if (story.privacy === "private" && story.userId !== userId) continue;
      // Skip friends-only stories from users we don't follow
      if (story.privacy === "friends" && !followingIds.includes(story.userId)) continue;

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
        textBgColor: story.textBgColor,
        textFontSize: story.textFontSize,
        textFontWeight: story.textFontWeight,
        textPosition: story.textPosition,
        backgroundColor: story.backgroundColor,
        stickerData: story.stickerData,
        expiresAt: story.expiresAt,
        createdAt: story.createdAt,
        viewed: story.views.length > 0,
        reaction: story.reactions[0]?.emoji ?? null,
        reactionCount: story._count.reactions,
      });
    }

    return Object.values(grouped);
  },

  async addView(storyId: string, userId: string) {
    await prisma.story.findUniqueOrThrow({ where: { id: storyId } });

    await prisma.storyView.upsert({
      where: { storyId_userId: { storyId, userId } },
      create: { storyId, userId },
      update: {},
    });
    return { viewed: true };
  },

  async react(storyId: string, userId: string, emoji: string) {
    const story = await prisma.story.findUniqueOrThrow({ where: { id: storyId } })

    const existing = await prisma.storyReaction.findUnique({
      where: { storyId_userId: { storyId, userId } },
    })

    if (existing && existing.emoji === emoji) {
      // Same emoji — toggle off (use deleteMany to avoid race condition)
      await prisma.storyReaction.deleteMany({ where: { storyId, userId } });
      return { reacted: false, emoji: null };
    }

    // Create or update atomically — handles race condition
    await prisma.storyReaction.upsert({
      where: { storyId_userId: { storyId, userId } },
      create: { storyId, userId, emoji },
      update: { emoji },
    });
    return { reacted: true, emoji };
  },

  async getInteractions(storyId: string, userId: string) {
    const story = await prisma.story.findUniqueOrThrow({
      where: { id: storyId },
      select: { userId: true },
    });
    if (story.userId !== userId) throw new AppError(403, "Not your story");

    const [views, reactions] = await Promise.all([
      prisma.storyView.findMany({
        where: { storyId },
        include: {
          user: { select: { id: true, name: true, username: true, avatar: true } },
        },
        orderBy: { viewedAt: "desc" },
      }),
      prisma.storyReaction.findMany({
        where: { storyId },
        include: {
          user: { select: { id: true, name: true, username: true, avatar: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const reactionMap = new Map(reactions.map((r) => [r.userId, r.emoji]));
    const emojiBreakdown: Record<string, number> = {};
    for (const r of reactions) {
      emojiBreakdown[r.emoji] = (emojiBreakdown[r.emoji] ?? 0) + 1;
    }

    return {
      totalViews: views.length,
      totalReactions: reactions.length,
      emojiBreakdown,
      items: views.map((v) => ({
        userId: v.userId,
        user: v.user,
        viewedAt: v.viewedAt,
        reaction: reactionMap.get(v.userId) ?? null,
      })),
    };
  },

  async delete(storyId: string, userId: string) {
    const story = await prisma.story.findUniqueOrThrow({ where: { id: storyId } });
    if (story.userId !== userId) throw new AppError(403, "Not your story");
    if (story.mediaUrl) {
      const publicId = extractPublicId(story.mediaUrl);
      if (publicId) deleteImage(publicId).catch(() => {});
    }
    await prisma.story.delete({ where: { id: storyId } });
  },

  async cleanupExpired() {
    const expired = await prisma.story.findMany({
      where: { expiresAt: { lt: new Date() } },
      select: { mediaUrl: true },
    });
    for (const story of expired) {
      if (story.mediaUrl) {
        const publicId = extractPublicId(story.mediaUrl);
        if (publicId) deleteImage(publicId).catch(() => {});
      }
    }
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
