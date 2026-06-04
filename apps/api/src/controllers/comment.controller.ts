import { Request, Response, NextFunction } from "express";
import { createCommentSchema } from "../utils/validators";
import { commentService } from "../services/comment.service";

type P = Record<string, string>;

export const commentController = {
  async getByPost(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const cursor = req.query.cursor as string | undefined;
      const limit = Number(req.query.limit) || 20;
      const result = await commentService.getByPost(req.params.postId, cursor, limit);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const { content, parentId } = createCommentSchema.parse(req.body);
      const comment = await commentService.create(
        req.params.postId,
        req.user!.id,
        content,
        parentId,
      );
      res.status(201).json({ success: true, data: comment });
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const { content } = createCommentSchema.parse(req.body);
      const comment = await commentService.update(req.params.commentId, req.user!.id, content);
      res.json({ success: true, data: comment });
    } catch (err) {
      next(err);
    }
  },

  async delete(req: Request<P>, res: Response, next: NextFunction) {
    try {
      await commentService.delete(req.params.commentId, req.user!.id);
      res.json({ success: true, message: "Comment deleted" });
    } catch (err) {
      next(err);
    }
  },

  async togglePin(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const comment = await commentService.togglePin(req.params.commentId);
      res.json({ success: true, data: comment });
    } catch (err) {
      next(err);
    }
  },
};
