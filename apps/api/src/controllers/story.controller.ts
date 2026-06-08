import type { Request, Response, NextFunction } from "express";
import { createStorySchema, reactStorySchema, votePollSchema } from "../utils/validators";
import { storyService } from "../services/story.service";

type P = Record<string, string>;

export const storyController = {
  async create(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const data = createStorySchema.parse(req.body);
      const story = await storyService.create({ ...data, userId: req.user!.id });
      res.status(201).json({ success: true, data: story });
    } catch (err) {
      next(err);
    }
  },

  async getFriendsStories(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const stories = await storyService.getFriendsStories(req.user!.id);
      res.json({ success: true, data: stories });
    } catch (err) {
      next(err);
    }
  },

  async addView(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const result = await storyService.addView(req.params.id, req.user!.id);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async react(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const { emoji } = reactStorySchema.parse(req.body);
      const result = await storyService.react(req.params.id, req.user!.id, emoji);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async getInteractions(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const result = await storyService.getInteractions(req.params.id, req.user!.id);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async delete(req: Request<P>, res: Response, next: NextFunction) {
    try {
      await storyService.delete(req.params.id, req.user!.id);
      res.json({ success: true, message: "Story deleted" });
    } catch (err) {
      next(err);
    }
  },

  async votePoll(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const { optionIndex } = votePollSchema.parse(req.body);
      const result = await storyService.votePoll(req.params.id, req.user!.id, optionIndex);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async getPollResults(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const result = await storyService.getPollResults(req.params.id);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },
};
