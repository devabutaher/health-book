import { Router } from "express";
import { postController } from "../controllers/post.controller";
import { authenticate, postLimiter } from "../middleware";
import { upload } from "../middleware/upload";

const router = Router() as ReturnType<typeof Router>;

router.post("/", authenticate, postLimiter, postController.create);
router.get("/feed", authenticate, postController.getFeed);
router.get("/explore", authenticate, postController.getExplore);
router.get("/saved", authenticate, postController.getSaved);
router.get("/group/:id", authenticate, postController.getGroupFeed);
router.get("/user/:userId", authenticate, postController.getUserPosts);
router.get("/drafts", authenticate, postController.getDrafts);
router.get("/:id", authenticate, postController.getById);
router.put("/:id", authenticate, postLimiter, postController.update);
router.delete("/:id", authenticate, postController.delete);
router.post("/:id/reactions", authenticate, postLimiter, postController.toggleReaction);
router.delete("/:id/reactions", authenticate, postController.removeReaction);
router.post("/:id/save", authenticate, postLimiter, postController.toggleSave);
router.post("/:id/publish", authenticate, postLimiter, postController.publishDraft);
router.post(
  "/media",
  authenticate,
  postLimiter,
  upload.single("image"),
  postController.uploadMedia,
);

export default router;
