import { Router } from "express";
import { reelController } from "../controllers/reel.controller";
import { authenticate } from "../middleware";
import { upload } from "../middleware/upload";

const router = Router() as ReturnType<typeof Router>;

router.get("/", authenticate, reelController.browse);
router.get("/:id", authenticate, reelController.getById);

router.post("/", authenticate, reelController.create);
router.post("/upload", authenticate, upload.single("video"), reelController.upload);
router.post("/:id/like", authenticate, reelController.toggleLike);
router.post("/:id/comments", authenticate, reelController.addComment);
router.patch("/:id", authenticate, reelController.update);
router.delete("/:id", authenticate, reelController.delete);
router.delete("/:id/comments/:commentId", authenticate, reelController.deleteComment);

export default router;
