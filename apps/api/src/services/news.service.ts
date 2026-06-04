import { prisma } from "../lib/prisma";

export const newsService = {
  async list(category?: string) {
    const where = category ? { category } : {};
    return prisma.newsArticle.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      take: 20,
    });
  },
};
