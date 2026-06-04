import type { Request, Response, NextFunction } from "express";
import { postQuizService } from "../services/postQuiz.service";

type P = Record<string, string>;

export const postQuizController = {
  async answer(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const result = await postQuizService.answer(
        req.params.postId,
        req.user!.id,
        req.body.selectedIndex,
      );
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },
  async results(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const result = await postQuizService.results(req.params.postId);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },
};
