import { Router } from "express";
import { postQuizController } from "../controllers/postQuiz.controller";
import { authenticate } from "../middleware";

const router = Router() as ReturnType<typeof Router>;
router.use(authenticate);

router.post("/:postId/answer", postQuizController.answer);
router.get("/:postId/results", postQuizController.results);

export default router;
