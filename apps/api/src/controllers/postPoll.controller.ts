import type { Request, Response, NextFunction } from "express";
import { postPollService } from "../services/postPoll.service";

type P = Record<string, string>;

export const postPollController = {
  async get(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const poll = await postPollService.get(req.params.pollId, req.user!.id);
      res.json({ success: true, data: poll });
    } catch (err) {
      next(err);
    }
  },
  async vote(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const poll = await postPollService.vote(
        req.params.pollId,
        req.user!.id,
        req.body.optionIndex,
      );
      res.json({ success: true, data: poll });
    } catch (err) {
      next(err);
    }
  },
  async unvote(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const poll = await postPollService.unvote(req.params.pollId, req.user!.id);
      res.json({ success: true, data: poll });
    } catch (err) {
      next(err);
    }
  },
  async remove(req: Request<P>, res: Response, next: NextFunction) {
    try {
      await postPollService.remove(req.params.pollId, req.user!.id);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  },
};
