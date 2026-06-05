import { Router } from "express";
import { postController } from "../controllers/post.controller";
import { authenticate } from "../middleware";
import { upload } from "../middleware/upload";

const router = Router() as ReturnType<typeof Router>;

router.post("/", authenticate, postController.create);
router.get("/feed", authenticate, postController.getFeed);
router.get("/explore", postController.getExplore);
router.get("/saved", authenticate, postController.getSaved);
router.get("/group/:id", authenticate, postController.getGroupFeed);
router.get("/user/:userId", postController.getUserPosts);
router.get("/drafts", authenticate, postController.getDrafts);
router.get("/:id", postController.getById);
router.put("/:id", authenticate, postController.update);
router.delete("/:id", authenticate, postController.delete);
router.post("/:id/reactions", authenticate, postController.toggleReaction);
router.delete("/:id/reactions", authenticate, postController.removeReaction);
router.post("/:id/save", authenticate, postController.toggleSave);
router.post("/:id/publish", authenticate, postController.publishDraft);
router.post("/media", authenticate, upload.single("image"), postController.uploadMedia);

export default router;
