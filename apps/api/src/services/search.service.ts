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
    const hashtags = await prisma.hashtag.findMany({
      where: { name: { contains: q.toLowerCase(), mode: "insensitive" } },
      orderBy: { postCount: "desc" },
      take: limit,
    });

    return hashtags.map((h) => ({ tag: `#${h.name}`, count: h.postCount }));
  },

  async getRelatedHashtags(tag: string, limit = 10) {
    const results = await prisma.$queryRaw<Array<{ tag: string; count: bigint }>>`
      SELECT DISTINCT h2.name AS tag, h2."postCount" AS count
      FROM post_hashtags ph1
      JOIN hashtags h1 ON h1.id = ph1."hashtagId" AND h1.name = ${tag.toLowerCase()}
      JOIN post_hashtags ph2 ON ph2."postId" = ph1."postId"
      JOIN hashtags h2 ON h2.id = ph2."hashtagId" AND h2.name != ${tag.toLowerCase()}
      ORDER BY h2."postCount" DESC
      LIMIT ${limit}
    `;

    return results.map((r) => ({ tag: `#${r.tag}`, count: Number(r.count) }));
  },
};
