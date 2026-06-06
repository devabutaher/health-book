import { Router } from "express";
import { searchController } from "../controllers/search.controller";
import { authenticate, cacheControl } from "../middleware";

const router = Router() as ReturnType<typeof Router>;

router.use(authenticate);

router.get("/users", cacheControl(10, 30), searchController.users);
router.get("/posts", cacheControl(10, 30), searchController.posts);
router.get("/hashtags", cacheControl(60, 300), searchController.hashtags);
router.get("/related-hashtags", cacheControl(300, 600), searchController.getRelatedHashtags);

export default router;
