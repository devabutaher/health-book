import type { Request, Response, NextFunction } from "express";
import { highlightService } from "../services/highlight.service";
import {
  createHighlightSchema,
  updateHighlightSchema,
  addHighlightItemSchema,
  reorderHighlightItemsSchema,
} from "../utils/validators";

type P = Record<string, string>;

export const highlightController = {
  async getAll(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const highlights = await highlightService.getAll(req.user!.id);
      res.json({ success: true, data: highlights });
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const data = createHighlightSchema.parse(req.body);
      const highlight = await highlightService.create(req.user!.id, data);
      res.status(201).json({ success: true, data: highlight });
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const data = updateHighlightSchema.parse(req.body);
      const highlight = await highlightService.update(req.params.id, req.user!.id, data);
      res.json({ success: true, data: highlight });
    } catch (err) {
      next(err);
    }
  },

  async delete(req: Request<P>, res: Response, next: NextFunction) {
    try {
      await highlightService.delete(req.params.id, req.user!.id);
      res.json({ success: true, message: "Highlight deleted" });
    } catch (err) {
      next(err);
    }
  },

  async addItem(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const { storyId } = addHighlightItemSchema.parse(req.body);
      const item = await highlightService.addItem(req.params.id, req.user!.id, storyId);
      res.status(201).json({ success: true, data: item });
    } catch (err) {
      next(err);
    }
  },

  async removeItem(req: Request<P>, res: Response, next: NextFunction) {
    try {
      await highlightService.removeItem(req.params.id, req.user!.id, req.params.itemId);
      res.json({ success: true, message: "Item removed" });
    } catch (err) {
      next(err);
    }
  },

  async reorderItems(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const { itemIds } = reorderHighlightItemsSchema.parse(req.body);
      await highlightService.reorderItems(req.params.id, req.user!.id, itemIds);
      res.json({ success: true, message: "Items reordered" });
    } catch (err) {
      next(err);
    }
  },
};
