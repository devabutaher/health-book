import type { Request, Response, NextFunction } from "express";
import {
  createChallengeSchema,
  updateChallengeSchema,
  createCommentSchema,
  checkInSchema,
  commentReactionSchema,
  duelSchema,
} from "../utils/validators";
import { challengeService } from "../services/challenge.service";
import { challengeTemplateService } from "../services/challengeTemplate.service";
import type { ChallengeType, ChallengeCategory, ChallengeDifficulty } from "../../generated/prisma";

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
      const challenges = await challengeService.getMyChallenges(req.user!.id);
      res.json({ success: true, data: challenges });
    } catch (err) {
      next(err);
    }
  },

  async getSavedChallenges(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const challenges = await challengeService.getSaved(req.user!.id);
      res.json({ success: true, data: challenges });
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
      const content = req.body.content as string | undefined;
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
      const { userId: toUserId } = req.body as { userId: string };
      await challengeService.invite(req.params.id, req.user!.id, toUserId);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  },

  async respondToInvite(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const { accept } = req.body as { accept: boolean };
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
};
