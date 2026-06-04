import { Router } from "express";
import { newsController } from "../controllers/news.controller";
import { authenticate } from "../middleware";

const router = Router() as ReturnType<typeof Router>;
router.use(authenticate);

router.get("/", newsController.list);

export default router;
