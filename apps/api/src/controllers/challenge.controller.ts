import type { Request, Response, NextFunction } from "express";
import {
  createChallengeSchema,
  updateChallengeSchema,
  createCommentSchema,
  checkInSchema,
  commentReactionSchema,
  duelSchema,
  ratingSchema,
  shareChallengeSchema,
  inviteToChallengeSchema,
  respondToInviteSchema,
  upsertDayPlansSchema,
  uploadPhotoSchema,
} from "../utils/validators";
import { challengeService } from "../services/challenge.service";
import { challengeTemplateService } from "../services/challengeTemplate.service";
import { uploadImage, uploadVideo } from "../services/cloudinary";
import type { ChallengeType, ChallengeCategory, ChallengeDifficulty } from "../../generated/prisma";

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  path: string;
  size: number;
}

type P = Record<string, string>;

export const challengeController = {
  async browse(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const type = req.query.type as ChallengeType | undefined;
      const category = req.query.category as ChallengeCategory | undefined;
      const difficulty = req.query.difficulty as ChallengeDifficulty | undefined;
      const cursor = req.query.cursor as string | undefined;
      const limit = Number(req.query.limit) || 20;
      const groupId = req.query.groupId as string | undefined;
      const result = await challengeService.browse(
        req.user?.id,
        type,
        category,
        difficulty,
        cursor,
        limit,
        groupId,
      );
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async search(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const q = req.query.q as string;
      if (!q?.trim())
        return res.json({
          success: true,
          data: { challenges: [], nextCursor: null, hasMore: false },
        });
      const cursor = req.query.cursor as string | undefined;
      const limit = Number(req.query.limit) || 20;
      const result = await challengeService.search(req.user?.id, q.trim(), cursor, limit);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const challenge = await challengeService.getById(req.params.id, req.user?.id);
      res.json({ success: true, data: challenge });
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const data = createChallengeSchema.parse(req.body);
      const challenge = await challengeService.create({ ...data, createdById: req.user!.id });
      res.status(201).json({ success: true, data: challenge });
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const data = updateChallengeSchema.parse(req.body);
      const challenge = await challengeService.update(req.params.id, req.user!.id, data);
      res.json({ success: true, data: challenge });
    } catch (err) {
      next(err);
    }
  },

  async join(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const result = await challengeService.join(req.params.id, req.user!.id);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async leave(req: Request<P>, res: Response, next: NextFunction) {
    try {
      await challengeService.leave(req.params.id, req.user!.id);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request<P>, res: Response, next: NextFunction) {
    try {
      await challengeService.remove(req.params.id, req.user!.id);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  },

  async checkIn(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const data = checkInSchema.parse(req.body);
      const result = await challengeService.checkIn(req.params.id, req.user!.id, data);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async getCalendar(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const calendar = await challengeService.getCalendar(req.params.id, req.user!.id);
      res.json({ success: true, data: calendar });
    } catch (err) {
      next(err);
    }
  },

  async getBeforeAfter(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const result = await challengeService.getBeforeAfter(req.params.id, req.user!.id);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async getActivityFeed(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const cursor = req.query.cursor as string | undefined;
      const limit = Number(req.query.limit) || 20;
      const result = await challengeService.getActivityFeed(req.params.id, cursor, limit);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async getLeaderboard(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const limit = Number(req.query.limit) || 50;
      const leaderboard = await challengeService.getLeaderboard(req.params.id, limit);
      res.json({ success: true, data: leaderboard });
    } catch (err) {
      next(err);
    }
  },

  async getMyChallenges(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const cursor = req.query.cursor as string | undefined;
      const limit = Number(req.query.limit) || 100;
      const result = await challengeService.getMyChallenges(req.user!.id, cursor, limit);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async getSavedChallenges(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const cursor = req.query.cursor as string | undefined;
      const limit = Number(req.query.limit) || 50;
      const result = await challengeService.getSaved(req.user!.id, cursor, limit);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async toggleSave(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const result = await challengeService.toggleSave(req.params.id, req.user!.id);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async share(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const { content } = shareChallengeSchema.parse(req.body);
      const post = await challengeService.share(req.params.id, req.user!.id, content);
      res.json({ success: true, data: post });
    } catch (err) {
      next(err);
    }
  },

  async getComments(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const cursor = req.query.cursor as string | undefined;
      const limit = Number(req.query.limit) || 20;
      const result = await challengeService.getComments(req.params.id, cursor, limit);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async addComment(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const { content, parentId } = createCommentSchema.parse(req.body);
      const comment = await challengeService.addComment(
        req.params.id,
        req.user!.id,
        content,
        parentId,
      );
      res.status(201).json({ success: true, data: comment });
    } catch (err) {
      next(err);
    }
  },

  async deleteComment(req: Request<P>, res: Response, next: NextFunction) {
    try {
      await challengeService.deleteComment(req.params.commentId, req.user!.id);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  },

  async reactToComment(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const { type } = commentReactionSchema.parse(req.body);
      const result = await challengeService.reactToComment(
        req.params.commentId,
        req.user!.id,
        type,
      );
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async removeCommentReaction(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const { type } = commentReactionSchema.parse(req.body);
      const result = await challengeService.removeReaction(
        req.params.commentId,
        req.user!.id,
        type,
      );
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async invite(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const { userId: toUserId } = inviteToChallengeSchema.parse(req.body);
      const invite = await challengeService.invite(req.params.id, req.user!.id, toUserId);
      res.json({ success: true, data: invite });
    } catch (err) {
      next(err);
    }
  },

  async respondToInvite(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const { accept } = respondToInviteSchema.parse(req.body);
      await challengeService.respondToInvite(req.params.inviteId, req.user!.id, accept);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  },

  async getMyInvites(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const invites = await challengeService.getMyInvites(req.user!.id);
      res.json({ success: true, data: invites });
    } catch (err) {
      next(err);
    }
  },

  async getUserStats(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const targetUserId = req.params.userId || req.user!.id;
      const stats = await challengeService.getUserStats(targetUserId);
      res.json({ success: true, data: stats });
    } catch (err) {
      next(err);
    }
  },

  async createDuel(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const data = duelSchema.parse(req.body);
      const challenge = await challengeService.createDuel({ ...data, createdById: req.user!.id });
      res.status(201).json({ success: true, data: challenge });
    } catch (err) {
      next(err);
    }
  },

  async getDuel(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const duel = await challengeService.getDuel(req.params.id);
      res.json({ success: true, data: duel });
    } catch (err) {
      next(err);
    }
  },

  async upsertDayPlans(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const { plans } = upsertDayPlansSchema.parse(req.body);
      const result = await challengeService.upsertDayPlans(req.params.id, req.user!.id, plans);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async getDayPlans(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const result = await challengeService.getDayPlans(req.params.id);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async getDayPlan(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const day = Number(req.params.day);
      const result = await challengeService.getDayPlan(req.params.id, day);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async rate(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const { rating, review } = ratingSchema.parse(req.body);
      const result = await challengeService.rate(req.params.id, req.user!.id, rating, review);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async getRatings(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const result = await challengeService.getRatings(req.params.id, req.user?.id);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async listTemplates(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const category = req.query.category as ChallengeCategory | undefined;
      const type = req.query.type as ChallengeType | undefined;
      const templates = await challengeTemplateService.list(category, type);
      res.json({ success: true, data: templates });
    } catch (err) {
      next(err);
    }
  },

  async seedTemplates(_req: Request<P>, res: Response, next: NextFunction) {
    try {
      const result = await challengeTemplateService.seedIfEmpty();
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async uploadMedia(req: Request<P> & { file?: MulterFile }, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "No file provided" });
      }
      if (req.file.mimetype.startsWith("video/")) {
        const result = await uploadVideo(req.file.path, "challenges");
        res.json({ success: true, data: { url: result.url, thumbnailUrl: result.thumbnailUrl } });
      } else {
        const url = await uploadImage(req.file.path, "challenges");
        res.json({ success: true, data: { url } });
      }
    } catch (err) {
      next(err);
    }
  },

  async uploadBeforePhoto(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const { photoUrl } = uploadPhotoSchema.parse(req.body);
      const result = await challengeService.uploadBeforePhoto(
        req.params.id,
        req.user!.id,
        photoUrl,
      );
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async uploadAfterPhoto(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const { photoUrl } = uploadPhotoSchema.parse(req.body);
      const result = await challengeService.uploadAfterPhoto(req.params.id, req.user!.id, photoUrl);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },
};
