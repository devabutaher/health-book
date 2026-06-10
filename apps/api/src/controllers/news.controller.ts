import type { Request, Response, NextFunction } from "express";
import { newsService } from "../services/news.service";

export const newsController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { category } = req.query;
      const articles = await newsService.list(category as string | undefined);
      res.json({ success: true, data: articles });
    } catch (err) {
      next(err);
    }
  },
};
