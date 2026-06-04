import type { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";

export const newsController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { category } = req.query;
      const where = category ? { category: category as string } : {};
      const articles = await prisma.newsArticle.findMany({
        where,
        orderBy: { publishedAt: "desc" },
        take: 20,
      });
      res.json({ success: true, data: articles });
    } catch (err) {
      next(err);
    }
  },
};
