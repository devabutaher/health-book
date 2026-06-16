import { prisma } from "../lib/prisma";
import { Prisma } from "../../generated/prisma";
import { AppError } from "../utils/AppError";
import { broadcastRealtime } from "../utils/realtime";
import { deleteImage, deleteVideo, extractPublicId } from "./cloudinary";
import type { PostPrivacy, ReactionType, HealthLogType } from "../../generated/prisma";
import { notificationService } from "./notification.service";
import { notifyMentions } from "../utils/mentions";
import { syncPostHashtags } from "../utils/hashtags";

const postSelectFields = {
  id: true,
  content: true,
  mediaUrls: true,
  privacy: true,
  userId: true,
  templateType: true,
  templateData: true,
  healthLogId: true,
  groupId: true,
  isDraft: true,
  scheduledAt: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

const userSelect = {
  select: { id: true, name: true, username: true, avatar: true, isVerified: true },
} as const;

const healthLogSelect = {
  select: { id: true, type: true, score: true, data: true, date: true },
} as const;

const pollWithVotes = {
  include: {
    votes: { select: { optionIndex: true, userId: true } },
  },
} as const;

function enrichPost(post: Record<string, unknown>, userId: string) {
  const poll = post.poll as
    | {
        options: string[];
        votes: Array<{ optionIndex: number; userId: string }>;
        id: string;
        postId: string;
        question: string;
        isMultipleChoice: boolean;
        expiresAt: Date | null;
        createdAt: Date;
      }
    | undefined;
  if (poll) {
    const totalVotes = poll.votes.length;
    const votes = poll.options.map((_: string, idx: number) => ({
      optionIndex: idx,
      _count: poll.votes.filter((v) => v.optionIndex === idx).length,
    }));
    return {
      ...post,
      poll: {
        id: poll.id,
        postId: poll.postId,
        question: poll.question,
        options: poll.options,
        isMultipleChoice: poll.isMultipleChoice,
        expiresAt: poll.expiresAt,
        createdAt: poll.createdAt,
        votes,
        userVote: poll.votes.find((v) => v.userId === userId)?.optionIndex ?? null,
        totalVotes,
      },
    };
  }
  return post;
}

export const postService = {
  async create(data: {
    content: string;
    mediaUrls?: string[];
    privacy?: PostPrivacy;
    userId: string;
    templateType?: string;
    templateData?: Record<string, unknown>;
    healthLogId?: string;
    groupId?: string;
    isDraft?: boolean;
    scheduledAt?: string | null;
    poll?: { question: string; options: string[]; isMultipleChoice?: boolean; expiresAt?: string };
  }) {
    const postData = {
      content: data.content,
      mediaUrls: data.mediaUrls || [],
      privacy: data.privacy || "PUBLIC",
      userId: data.userId,
      templateType: data.templateType,
      templateData: (data.templateData ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      healthLogId: data.healthLogId,
      groupId: data.groupId,
      isDraft: data.isDraft ?? false,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
    };

    if (data.poll) {
      if (data.poll.options.length < 2) throw new AppError(400, "At least 2 options required");
      if (data.poll.options.length > 10) throw new AppError(400, "Maximum 10 options allowed");

      const post = await prisma.post.create({
        data: {
          ...postData,
          poll: {
            create: {
              question: data.poll.question,
              options: data.poll.options,
              isMultipleChoice: data.poll.isMultipleChoice ?? false,
              expiresAt: data.poll.expiresAt ? new Date(data.poll.expiresAt) : null,
            },
          },
        },
        select: {
          ...postSelectFields,
          user: userSelect,
          _count: { select: { reactions: true, comments: true } },
          poll: pollWithVotes,
        },
      });

      if (data.content) {
        syncPostHashtags(post.id, data.content).catch(() => {});
      }
      if (!post.isDraft && data.content) {
        notifyMentions(data.content, data.userId, post.id).catch(() => {});
      }
      if (!post.isDraft) {
        broadcastRealtime(`hb-post:${post.id}`, "POST_CREATED", {
          postId: post.id,
          userId: data.userId,
          groupId: data.groupId || null,
        }).catch(() => {});
        if (data.groupId) {
          broadcastRealtime(`hb-group:${data.groupId}`, "POST_CREATED", {
            groupId: data.groupId,
          }).catch(() => {});
        }
        if (!data.groupId) {
          prisma.follow
            .findMany({
              where: { followingId: data.userId },
              select: { followerId: true },
              take: 200,
            })
            .then((followers) => {
              Promise.allSettled(
                followers.map((f) =>
                  broadcastRealtime(`hb-feed:${f.followerId}`, "POST_CREATED", {
                    postId: post.id,
                    userId: data.userId,
                  }),
                ),
              );
            })
            .catch(() => {});
        }
      }

      return enrichPost(post, data.userId);
    }

    const post = await prisma.post.create({
      data: postData,
      select: {
        ...postSelectFields,
        user: userSelect,
        _count: { select: { reactions: true, comments: true } },
      },
    });

    if (data.content) {
      syncPostHashtags(post.id, data.content).catch(() => {});
    }

    if (!post.isDraft && data.content) {
      notifyMentions(data.content, data.userId, post.id).catch(() => {});
    }

    if (!post.isDraft) {
      broadcastRealtime(`hb-post:${post.id}`, "POST_CREATED", {
        postId: post.id,
        userId: data.userId,
        groupId: data.groupId || null,
      }).catch(() => {});
      if (data.groupId) {
        broadcastRealtime(`hb-group:${data.groupId}`, "POST_CREATED", {
          groupId: data.groupId,
        }).catch(() => {});
      }
      if (!data.groupId) {
        prisma.follow
          .findMany({
            where: { followingId: data.userId },
            select: { followerId: true },
            take: 200,
          })
          .then((followers) => {
            Promise.allSettled(
              followers.map((f) =>
                broadcastRealtime(`hb-feed:${f.followerId}`, "POST_CREATED", {
                  postId: post.id,
                  userId: data.userId,
                }),
              ),
            );
          })
          .catch(() => {});
      }
    }

    return post;
  },

  async getById(postId: string, userId?: string) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        ...postSelectFields,
        user: userSelect,
        reactions: {
          where: { userId: userId ?? "" },
          take: 1,
          select: { type: true, userId: true },
        },
        _count: { select: { reactions: true, comments: true } },
        healthLog: healthLogSelect,
        poll: pollWithVotes,
      },
    });
    return post ? enrichPost(post, userId || "") : null;
  },

  async update(
    postId: string,
    userId: string,
    data: {
      content?: string;
      privacy?: PostPrivacy;
      mediaUrls?: string[];
      templateType?: string;
      templateData?: Record<string, unknown>;
      isDraft?: boolean;
      scheduledAt?: string | null;
    },
  ) {
    const updateData: Record<string, unknown> = { ...data };
    if (data.scheduledAt !== undefined) {
      updateData.scheduledAt = data.scheduledAt ? new Date(data.scheduledAt) : null;
    }
    if (data.templateData !== undefined) {
      updateData.templateData = (data.templateData ?? Prisma.JsonNull) as Prisma.InputJsonValue;
    }
    if (data.mediaUrls !== undefined) {
      const existing = await prisma.post.findUnique({
        where: { id: postId },
        select: { mediaUrls: true },
      });
      if (existing) {
        for (const url of existing.mediaUrls) {
          const publicId = extractPublicId(url);
          if (publicId) deleteImage(publicId).catch(() => {});
        }
      }
    }
    const post = await prisma.post.update({
      where: { id: postId },
      data: updateData,
      select: {
        ...postSelectFields,
        user: userSelect,
        _count: { select: { reactions: true, comments: true } },
        poll: pollWithVotes,
      },
    });

    if (data.content) {
      syncPostHashtags(postId, data.content).catch(() => {});
      notifyMentions(data.content, userId, post.id).catch(() => {});
    }

    broadcastRealtime(`hb-post:${postId}`, "POST_UPDATED", {
      postId,
    }).catch(() => {});

    return enrichPost(post, userId);
  },

  async delete(postId: string, userId: string) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { mediaUrls: true, userId: true },
    });
    if (!post || post.userId !== userId) throw new AppError(404, "Post not found");
    for (const url of post.mediaUrls) {
      const publicId = extractPublicId(url);
      if (publicId) deleteImage(publicId).catch(() => {});
    }
    await prisma.post.delete({ where: { id: postId } });

    broadcastRealtime(`hb-post:${postId}`, "POST_DELETED", {
      postId,
      userId,
    }).catch(() => {});
  },

  async toggleReaction(postId: string, userId: string, type: ReactionType) {
    const existing = await prisma.reaction.findUnique({
      where: { postId_userId: { postId, userId } },
    });

    if (existing) {
      if (existing.type === type) {
        await prisma.reaction.delete({ where: { id: existing.id } });
        setTimeout(() => {
          broadcastRealtime(`hb-post:${postId}`, "REACTION_REMOVED", {
            postId,
            userId,
            type,
          }).catch(() => {});
        }, 0);
        return { type, removed: true };
      }
      await prisma.reaction.update({ where: { id: existing.id }, data: { type } });
      setTimeout(() => {
        broadcastRealtime(`hb-post:${postId}`, "REACTION_CHANGED", {
          postId,
          userId,
          fromType: existing.type,
          toType: type,
        }).catch(() => {});
      }, 0);
      return { type, changed: true };
    }

    await prisma.reaction.create({ data: { type, postId, userId } });

    setTimeout(() => {
      broadcastRealtime(`hb-post:${postId}`, "REACTION_ADDED", {
        postId,
        userId,
        type,
      }).catch(() => {});
    }, 0);

    const post = await prisma.post.findUnique({ where: { id: postId }, select: { userId: true } });
    if (post && post.userId !== userId) {
      notificationService
        .create({
          type: "POST_REACTION",
          userId: post.userId,
          fromUserId: userId,
          postId,
        })
        .catch(() => {});
    }

    return { type, added: true };
  },

  async removeReaction(postId: string, userId: string) {
    await prisma.reaction.deleteMany({ where: { postId, userId } });
  },

  async toggleSave(postId: string, userId: string) {
    const existing = await prisma.savedPost.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    let saved: boolean;
    if (existing) {
      await prisma.savedPost.delete({ where: { userId_postId: { userId, postId } } });
      saved = false;
    } else {
      await prisma.savedPost.create({ data: { userId, postId } });
      saved = true;
    }

    broadcastRealtime(`hb-post:${postId}`, saved ? "POST_SAVED" : "POST_UNSAVED", {
      postId,
      userId,
    }).catch(() => {});

    return { saved };
  },

  async getSaved(userId: string, cursor?: string, limit = 20) {
    const saved = await prisma.savedPost.findMany({
      where: { userId },
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { userId_postId: { userId, postId: cursor } } } : {}),
      select: {
        userId: true,
        postId: true,
        createdAt: true,
        post: {
          select: {
            ...postSelectFields,
            user: userSelect,
            _count: { select: { reactions: true, comments: true } },
            poll: pollWithVotes,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const hasMore = saved.length > limit;
    const items = hasMore ? saved.slice(0, limit) : saved;

    return {
      posts: items.map((s) => enrichPost(s.post, userId)),
      nextCursor: hasMore ? items[items.length - 1]?.postId : null,
      hasMore,
    };
  },

  async getFeed(userId: string, cursor?: string, limit = 10) {
    const fullPosts = await prisma.post.findMany({
      where: {
        privacy: "PUBLIC",
        isDraft: false,
      },
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      select: {
        ...postSelectFields,
        user: userSelect,
        reactions: { where: { userId }, take: 1, select: { type: true, userId: true } },
        _count: { select: { reactions: true, comments: true } },
        healthLog: healthLogSelect,
        poll: pollWithVotes,
      },
      orderBy: { createdAt: "desc" },
    });

    const hasMore = fullPosts.length > limit;
    const items = hasMore ? fullPosts.slice(0, limit) : fullPosts;

    return {
      posts: items.map((p) => enrichPost(p, userId)),
      nextCursor: hasMore ? items[items.length - 1]?.id : null,
      hasMore,
    };
  },

  async getUserPosts(
    userId: string,
    viewerId?: string,
    cursor?: string,
    limit = 10,
    includeDrafts = false,
  ) {
    const posts = await prisma.post.findMany({
      where: { userId, ...(includeDrafts ? {} : { isDraft: false }) },
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      select: {
        ...postSelectFields,
        user: userSelect,
        reactions: {
          where: { userId: viewerId ?? "" },
          take: 1,
          select: { type: true, userId: true },
        },
        _count: { select: { reactions: true, comments: true } },
        healthLog: healthLogSelect,
        poll: pollWithVotes,
      },
      orderBy: { createdAt: "desc" },
    });

    const hasMore = posts.length > limit;
    const items = hasMore ? posts.slice(0, limit) : posts;

    const authorIds = [...new Set(items.map((p) => p.userId))];
    const follows = await prisma.follow.findMany({
      where: { followerId: userId, followingId: { in: authorIds } },
      select: { followingId: true },
    });
    const followingSet = new Set(follows.map((f) => f.followingId));

    return {
      posts: items.map((p) => ({
        ...enrichPost(p, userId),
        user: { ...p.user, isFollowing: followingSet.has(p.userId) },
      })),
      nextCursor: hasMore ? items[items.length - 1]?.id : null,
      hasMore,
    };
  },

  async getGroupFeed(groupId: string, userId: string, cursor?: string, limit = 20) {
    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (!membership) throw new AppError(403, "Not a member of this group");

    const posts = await prisma.post.findMany({
      where: { groupId },
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      select: {
        ...postSelectFields,
        user: userSelect,
        reactions: { where: { userId }, take: 1, select: { type: true, userId: true } },
        _count: { select: { reactions: true, comments: true } },
        healthLog: healthLogSelect,
        poll: pollWithVotes,
      },
      orderBy: { createdAt: "desc" },
    });

    const hasMore = posts.length > limit;
    const items = hasMore ? posts.slice(0, limit) : posts;

    return {
      posts: items.map((p) => enrichPost(p, userId)),
      nextCursor: hasMore ? items[items.length - 1]?.id : null,
      hasMore,
    };
  },

  async getDrafts(userId: string) {
    const drafts = await prisma.post.findMany({
      where: { userId, isDraft: true },
      orderBy: { updatedAt: "desc" },
      take: 50,
      select: {
        ...postSelectFields,
        user: userSelect,
        _count: { select: { reactions: true, comments: true } },
        poll: pollWithVotes,
      },
    });
    return drafts.map((d) => enrichPost(d, userId));
  },

  async publishDraft(postId: string, userId: string) {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post || post.userId !== userId) throw new AppError(404, "Post not found");
    if (!post.isDraft) throw new AppError(400, "Post is not a draft");
    const updated = await prisma.post.update({
      where: { id: postId },
      data: { isDraft: false, publishedAt: new Date() },
      select: {
        ...postSelectFields,
        user: userSelect,
        _count: { select: { reactions: true, comments: true } },
        poll: pollWithVotes,
      },
    });

    broadcastRealtime(`hb-post:${postId}`, "POST_CREATED", {
      postId,
    }).catch(() => {});

    return enrichPost(updated, userId);
  },

  async getExplore(cursor?: string, limit = 20, category?: string) {
    const categoryTemplateMap: Record<string, string> = {
      fitness: "WORKOUT",
      "mental-health": "MOOD",
      yoga: "WORKOUT",
      meditation: "MOOD",
    };

    const where: Prisma.PostWhereInput = { privacy: "PUBLIC", isDraft: false };
    if (category && category !== "all") {
      const templateType = categoryTemplateMap[category];
      if (templateType) {
        where.healthLog = { type: templateType as HealthLogType };
      } else {
        where.content = { contains: category, mode: "insensitive" };
      }
    }

    const posts = await prisma.post.findMany({
      where,
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      select: {
        ...postSelectFields,
        user: userSelect,
        _count: { select: { reactions: true, comments: true } },
        healthLog: healthLogSelect,
        poll: pollWithVotes,
      },
      orderBy: { createdAt: "desc" },
    });

    const hasMore = posts.length > limit;
    const items = hasMore ? posts.slice(0, limit) : posts;

    return {
      posts: items,
      nextCursor: hasMore ? items[items.length - 1]?.id : null,
      hasMore,
    };
  },
};
