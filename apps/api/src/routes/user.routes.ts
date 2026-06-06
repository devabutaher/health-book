import { Router } from "express";
import { userController } from "../controllers/user.controller";
import { authenticate, cacheControl } from "../middleware";
import { upload } from "../middleware/upload";

const router = Router() as ReturnType<typeof Router>;

router.get("/suggested", authenticate, cacheControl(60, 300), userController.getSuggested);
router.get("/:username", authenticate, cacheControl(300, 600), userController.getProfile);
router.put("/me", authenticate, userController.updateMe);
router.post("/me/avatar", authenticate, upload.single("avatar"), userController.uploadAvatar);
router.post("/me/cover", authenticate, upload.single("cover"), userController.uploadCover);
router.post("/:userId/follow", authenticate, userController.follow);
router.delete("/:userId/follow", authenticate, userController.unfollow);
router.get("/:userId/followers", authenticate, cacheControl(60, 300), userController.getFollowers);
router.get("/:userId/following", authenticate, cacheControl(60, 300), userController.getFollowing);

export default router;
