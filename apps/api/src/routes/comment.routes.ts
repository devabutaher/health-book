import { Router } from "express";
import { commentController } from "../controllers/comment.controller";
import { authenticate } from "../middleware";

const router = Router() as ReturnType<typeof Router>;

router.get("/:postId", commentController.getByPost);
router.post("/:postId", authenticate, commentController.create);
router.put("/:commentId", authenticate, commentController.update);
router.delete("/:commentId", authenticate, commentController.delete);
router.post("/:commentId/pin", authenticate, commentController.togglePin);

export default router;
