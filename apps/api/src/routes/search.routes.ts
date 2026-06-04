import { Router } from "express";
import { searchController } from "../controllers/search.controller";
import { authenticate } from "../middleware";

const router = Router() as ReturnType<typeof Router>;

router.use(authenticate);

router.get("/users", searchController.users);
router.get("/posts", searchController.posts);
router.get("/hashtags", searchController.hashtags);
router.get("/related-hashtags", searchController.getRelatedHashtags);

export default router;
