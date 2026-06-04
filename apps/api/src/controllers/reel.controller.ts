import type { NextFunction, Request, Response } from "express";
import fs from "fs";
import { uploadVideo } from "../services/cloudinary";
import { reelService } from "../services/reel.service";
import { createReelCommentSchema, createReelSchema, updateReelSchema } from "../utils/validators";

type P = Record<string, string>;

export const reelController = {
  async browse(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const cursor = req.query.cursor as string | undefined;
      const limit = Number(req.query.limit) || 10;
      const result = await reelService.browse(cursor, limit, req.user?.id);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const reel = await reelService.getById(req.params.id, req.user?.id);
      res.json({ success: true, data: reel });
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const data = createReelSchema.parse(req.body);
      const reel = await reelService.create({ ...data, userId: req.user!.id });
      res.status(201).json({ success: true, data: reel });
    } catch (err) {
      next(err);
    }
  },

  async upload(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ success: false, message: "No video file provided" });
      }

      const caption = req.body.caption as string | undefined;
      const folder = "reels";

      // Upload to Cloudinary
      const { url, thumbnailUrl } = await uploadVideo(file.path, folder);

      // Clean up temp file
      fs.unlink(file.path, () => {});

      // Save to database
      const reel = await reelService.create({
        videoUrl: url,
        caption: caption?.trim() || undefined,
        thumbnailUrl: thumbnailUrl || undefined,
        userId: req.user!.id,
      });

      res.status(201).json({ success: true, data: reel });
    } catch (err) {
      next(err);
    }
  },

  async toggleLike(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const result = await reelService.toggleLike(req.params.id, req.user!.id);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async addComment(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const { content } = createReelCommentSchema.parse(req.body);
      const comment = await reelService.addComment(req.params.id, req.user!.id, content);
      res.status(201).json({ success: true, data: comment });
    } catch (err) {
      next(err);
    }
  },

  async deleteComment(req: Request<P>, res: Response, next: NextFunction) {
    try {
      await reelService.deleteComment(req.params.commentId, req.user!.id);
      res.json({ success: true, message: "Comment deleted" });
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const data = updateReelSchema.parse(req.body);
      const result = await reelService.update(req.params.id, req.user!.id, data);
      res.json({
        success: true,
        data: {
          id: result.id,
          videoUrl: result.videoUrl,
          caption: result.caption,
          thumbnailUrl: result.thumbnailUrl,
          user: result.user,
          likesCount: result._count.likes,
          commentsCount: result._count.comments,
          isLiked: Array.isArray(result.likes) ? result.likes.length > 0 : false,
          comments: result.comments,
          createdAt: result.createdAt,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async delete(req: Request<P>, res: Response, next: NextFunction) {
    try {
      await reelService.delete(req.params.id, req.user!.id);
      res.json({ success: true, message: "Reel deleted" });
    } catch (err) {
      next(err);
    }
  },
};
