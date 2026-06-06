import { Router } from "express";
import { postController } from "../controllers/post.controller";
import { authenticate, postLimiter, cacheControl } from "../middleware";
import { upload } from "../middleware/upload";

const router = Router() as ReturnType<typeof Router>;

router.post("/", authenticate, postLimiter, postController.create);
router.get("/feed", authenticate, cacheControl(10, 30), postController.getFeed);
router.get("/explore", cacheControl(60, 300), postController.getExplore);
router.get("/saved", authenticate, cacheControl(30, 120), postController.getSaved);
router.get("/group/:id", authenticate, cacheControl(10, 30), postController.getGroupFeed);
router.get("/user/:userId", cacheControl(30, 120), postController.getUserPosts);
router.get("/drafts", authenticate, cacheControl(30, 120), postController.getDrafts);
router.get("/:id", cacheControl(30, 120), postController.getById);
router.put("/:id", authenticate, postLimiter, postController.update);
router.delete("/:id", authenticate, postController.delete);
router.post("/:id/reactions", authenticate, postLimiter, postController.toggleReaction);
router.delete("/:id/reactions", authenticate, postController.removeReaction);
router.post("/:id/save", authenticate, postLimiter, postController.toggleSave);
router.post("/:id/publish", authenticate, postLimiter, postController.publishDraft);
router.post("/media", authenticate, postLimiter, upload.single("image"), postController.uploadMedia);

export default router;
