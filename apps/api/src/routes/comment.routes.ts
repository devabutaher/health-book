import { Router } from "express";
import { commentController } from "../controllers/comment.controller";
import { authenticate, postLimiter } from "../middleware";

const router = Router() as ReturnType<typeof Router>;

router.get("/:postId", commentController.getByPost);
router.post("/:postId", authenticate, postLimiter, commentController.create);
router.put("/:commentId", authenticate, postLimiter, commentController.update);
router.delete("/:commentId", authenticate, commentController.delete);
router.post("/:commentId/pin", authenticate, postLimiter, commentController.togglePin);

export default router;
