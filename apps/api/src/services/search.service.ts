import { prisma } from "../lib/prisma";

export const searchService = {
  async searchUsers(q: string, cursor?: string, limit = 20) {
    const take = limit + 1;
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { username: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, username: true, avatar: true, isVerified: true },
      take,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { createdAt: "desc" },
    });
    const hasMore = users.length > limit;
    const items = hasMore ? users.slice(0, limit) : users;
    return { users: items, nextCursor: hasMore ? items[items.length - 1]?.id : null, hasMore };
  },

  async searchPosts(q: string, cursor?: string, limit = 20) {
    const posts = await prisma.post.findMany({
      where: {
        content: { contains: q, mode: "insensitive" },
        privacy: "PUBLIC",
      },
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      include: {
        user: { select: { id: true, name: true, username: true, avatar: true, isVerified: true } },
        reactions: { select: { type: true, userId: true } },
        _count: { select: { comments: true } },
        healthLog: { select: { id: true, type: true, score: true, data: true, date: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const hasMore = posts.length > limit;
    const items = hasMore ? posts.slice(0, limit) : posts;

    return { posts: items, nextCursor: hasMore ? items[items.length - 1]?.id : null, hasMore };
  },

  async searchHashtags(q: string, limit = 20) {
    const posts = await prisma.post.findMany({
      where: {
        content: { contains: `#${q}`, mode: "insensitive" },
        privacy: "PUBLIC",
      },
      select: { content: true },
      take: 500,
    });

    const tagCounts = new Map<string, number>();
    const regex = new RegExp(`#${q}[\\w]+`, "gi");
    for (const post of posts) {
      const matches = post.content?.match(regex) || [];
      for (const tag of matches) {
        tagCounts.set(tag.toLowerCase(), (tagCounts.get(tag.toLowerCase()) || 0) + 1);
      }
    }

    return Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([tag, count]) => ({ tag, count }));
  },

  async getRelatedHashtags(tag: string, limit = 10) {
    const posts = await prisma.post.findMany({
      where: {
        content: { contains: `#${tag}`, mode: "insensitive" },
        privacy: "PUBLIC",
      },
      select: { content: true },
      take: 500,
    });

    const tagCounts = new Map<string, number>();
    const allTagsRegex = /#[\w]+/gi;
    for (const post of posts) {
      const matches = post.content?.match(allTagsRegex) || [];
      for (const t of matches) {
        const normalized = t.toLowerCase();
        if (normalized !== `#${tag.toLowerCase()}`) {
          tagCounts.set(normalized, (tagCounts.get(normalized) || 0) + 1);
        }
      }
    }

    return Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([t, count]) => ({ tag: t, count }));
  },
};
