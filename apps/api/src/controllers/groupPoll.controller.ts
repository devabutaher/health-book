import type { Request, Response, NextFunction } from "express";
import { groupPollService } from "../services/groupPoll.service";

type P = Record<string, string>;

export const groupPollController = {
  async create(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const { question, options, isMultipleChoice, expiresAt } = req.body;
      const poll = await groupPollService.create({
        groupId: req.params.groupId,
        createdById: req.user!.id,
        question,
        options,
        isMultipleChoice,
        expiresAt,
      });
      res.status(201).json({ success: true, data: poll });
    } catch (err) {
      next(err);
    }
  },
  async list(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const polls = await groupPollService.list(req.params.groupId, req.user!.id);
      res.json({ success: true, data: polls });
    } catch (err) {
      next(err);
    }
  },
  async vote(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const poll = await groupPollService.vote(
        req.params.pollId,
        req.user!.id,
        req.body.optionIndex,
      );
      res.json({ success: true, data: poll });
    } catch (err) {
      next(err);
    }
  },
  async remove(req: Request<P>, res: Response, next: NextFunction) {
    try {
      await groupPollService.remove(req.params.pollId, req.user!.id);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  },
  async unvote(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const poll = await groupPollService.unvote(req.params.pollId, req.user!.id);
      res.json({ success: true, data: poll });
    } catch (err) {
      next(err);
    }
  },
};
