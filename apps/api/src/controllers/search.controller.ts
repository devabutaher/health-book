import type { Request, Response, NextFunction } from "express";
import { searchService } from "../services/search.service";

export const searchController = {
  async users(req: Request, res: Response, next: NextFunction) {
    try {
      const q = (req.query.q as string) || "";
      const cursor = req.query.cursor as string | undefined;
      const result = await searchService.searchUsers(q, cursor);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  async posts(req: Request, res: Response, next: NextFunction) {
    try {
      const q = (req.query.q as string) || "";
      const cursor = req.query.cursor as string | undefined;
      const result = await searchService.searchPosts(q, cursor);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  async hashtags(req: Request, res: Response, next: NextFunction) {
    try {
      const q = (req.query.q as string) || "";
      const tags = await searchService.searchHashtags(q);
      res.json({ success: true, data: tags });
    } catch (err) {
      next(err);
    }
  },

  async getRelatedHashtags(req: Request, res: Response, next: NextFunction) {
    try {
      const tag = (req.query.tag as string) || "";
      const tags = await searchService.getRelatedHashtags(tag);
      res.json({ success: true, data: tags });
    } catch (err) {
      next(err);
    }
  },
};
