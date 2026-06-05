import { Request, Response, NextFunction } from "express";
import { createPostSchema, updatePostSchema, reactionSchema } from "../utils/validators";
import { postService } from "../services/post.service";
import { uploadImage, uploadVideo } from "../services/cloudinary";

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

type P = Record<string, string>;
type Req = Request<P>;

export const postController = {
  async create(req: Req, res: Response, next: NextFunction) {
    try {
      const data = createPostSchema.parse(req.body);
      const post = await postService.create({ ...data, userId: req.user!.id });
      res.status(201).json({ success: true, data: post });
    } catch (err) {
      next(err);
    }
  },

  async getDrafts(req: Req, res: Response, next: NextFunction) {
    try {
      const drafts = await postService.getDrafts(req.user!.id);
      res.json({ success: true, data: drafts });
    } catch (err) {
      next(err);
    }
  },

  async publishDraft(req: Req, res: Response, next: NextFunction) {
    try {
      const post = await postService.publishDraft(req.params.id, req.user!.id);
      res.json({ success: true, data: post });
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Req, res: Response, next: NextFunction) {
    try {
      const post = await postService.getById(req.params.id, req.user?.id);
      if (!post) {
        return res.status(404).json({ success: false, message: "Post not found" });
      }
      res.json({ success: true, data: post });
    } catch (err) {
      next(err);
    }
  },

  async update(req: Req, res: Response, next: NextFunction) {
    try {
      const data = updatePostSchema.parse(req.body);
      const existing = await postService.getById(req.params.id);
      if (!existing) {
        return res.status(404).json({ success: false, message: "Post not found" });
      }
      if (existing.userId !== req.user!.id) {
        return res.status(403).json({ success: false, message: "Not your post" });
      }
      if (!existing.isDraft) {
        const elapsed = Date.now() - new Date(String(existing.createdAt)).getTime();
        if (elapsed > 15 * 60 * 1000) {
          return res
            .status(403)
            .json({ success: false, message: "Edit window expired (15 minutes)" });
        }
      }
      const post = await postService.update(req.params.id, req.user!.id, data);
      res.json({ success: true, data: post });
    } catch (err) {
      next(err);
    }
  },

  async delete(req: Req, res: Response, next: NextFunction) {
    try {
      await postService.delete(req.params.id, req.user!.id);
      res.json({ success: true, message: "Post deleted" });
    } catch (err) {
      next(err);
    }
  },

  async toggleReaction(req: Req, res: Response, next: NextFunction) {
    try {
      const { type } = reactionSchema.parse(req.body);
      const result = await postService.toggleReaction(req.params.id, req.user!.id, type);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async removeReaction(req: Req, res: Response, next: NextFunction) {
    try {
      await postService.removeReaction(req.params.id, req.user!.id);
      res.json({ success: true, message: "Reaction removed" });
    } catch (err) {
      next(err);
    }
  },

  async toggleSave(req: Req, res: Response, next: NextFunction) {
    try {
      const result = await postService.toggleSave(req.params.id, req.user!.id);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async getSaved(req: Req, res: Response, next: NextFunction) {
    try {
      const cursor = req.query.cursor as string | undefined;
      const limit = Number(req.query.limit) || 20;
      const result = await postService.getSaved(req.user!.id, cursor, limit);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async getUserPosts(req: Req, res: Response, next: NextFunction) {
    try {
      const userId = req.params.userId;
      const cursor = req.query.cursor as string | undefined;
      const limit = Number(req.query.limit) || 10;
      const result = await postService.getUserPosts(userId, req.user?.id, cursor, limit);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async getFeed(req: Req, res: Response, next: NextFunction) {
    try {
      const cursor = req.query.cursor as string | undefined;
      const limit = Number(req.query.limit) || 10;
      const result = await postService.getFeed(req.user!.id, cursor, limit);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async getGroupFeed(req: Req, res: Response, next: NextFunction) {
    try {
      const cursor = req.query.cursor as string | undefined;
      const limit = Number(req.query.limit) || 20;
      const result = await postService.getGroupFeed(req.params.id, req.user!.id, cursor, limit);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async getExplore(req: Req, res: Response, next: NextFunction) {
    try {
      const cursor = req.query.cursor as string | undefined;
      const limit = Number(req.query.limit) || 20;
      const category = req.query.category as string | undefined;
      const result = await postService.getExplore(cursor, limit, category);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async uploadMedia(req: Request & { file?: MulterFile }, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "No file provided" });
      }
      if (req.file.mimetype.startsWith("video/")) {
        const result = await uploadVideo(req.file.path, "posts");
        res.json({ success: true, data: { url: result.url, thumbnailUrl: result.thumbnailUrl } });
      } else {
        const url = await uploadImage(req.file.path, "posts");
        res.json({ success: true, data: { url } });
      }
    } catch (err) {
      next(err);
    }
  },
};
