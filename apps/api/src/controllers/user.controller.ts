import { Request, Response, NextFunction } from "express";
import { updateProfileSchema } from "../utils/validators";
import { userService } from "../services/user.service";
import { uploadImage } from "../services/cloudinary";

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

export const userController = {
  async getProfile(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const username = req.params.username;
      const currentUserId = req.user?.id;
      const profile = await userService.getProfile(username, currentUserId);

      if (!profile) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      res.json({ success: true, data: profile });
    } catch (err) {
      next(err);
    }
  },

  async updateMe(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateProfileSchema.parse(req.body);
      const user = await userService.updateProfile(req.user!.id, data);
      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  },

  async uploadAvatar(req: Request & { file?: MulterFile }, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "No file provided" });
      }
      const url = await uploadImage(req.file.path, "avatars");
      const user = await userService.updateAvatar(req.user!.id, url);
      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  },

  async uploadCover(req: Request & { file?: MulterFile }, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "No file provided" });
      }
      const url = await uploadImage(req.file.path, "covers");
      const user = await userService.updateCover(req.user!.id, url);
      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  },

  async follow(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const userId = req.params.userId;
      if (userId === req.user!.id) {
        return res.status(400).json({ success: false, message: "Cannot follow yourself" });
      }
      await userService.follow(req.user!.id, userId);
      res.json({ success: true, message: "Followed" });
    } catch (err) {
      next(err);
    }
  },

  async unfollow(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const userId = req.params.userId;
      await userService.unfollow(req.user!.id, userId);
      res.json({ success: true, message: "Unfollowed" });
    } catch (err) {
      next(err);
    }
  },

  async getFollowers(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const userId = req.params.userId;
      const cursor = req.query.cursor as string | undefined;
      const limit = Number(req.query.limit) || 20;
      const result = await userService.getFollowers(req.user!.id, userId, cursor, limit);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async getSuggested(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await userService.getSuggested(req.user!.id);
      res.json({ success: true, data: users });
    } catch (err) {
      next(err);
    }
  },

  async getFollowing(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const userId = req.params.userId;
      const cursor = req.query.cursor as string | undefined;
      const limit = Number(req.query.limit) || 20;
      const result = await userService.getFollowing(req.user!.id, userId, cursor, limit);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },
};
