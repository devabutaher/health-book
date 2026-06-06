import { Router } from "express";
import { healthLogController } from "../controllers/healthLog.controller";
import { authenticate, cacheControl } from "../middleware";

const router = Router() as ReturnType<typeof Router>;

router.use(authenticate);

router.get("/trends", cacheControl(60, 300), healthLogController.trends);
router.get("/stats", cacheControl(60, 300), healthLogController.stats);
router.get("/calendar", cacheControl(60, 300), healthLogController.calendar);
router.get("/", cacheControl(60, 300), healthLogController.list);
router.post("/", healthLogController.create);
router.get("/:id", cacheControl(300, 600), healthLogController.getById);
router.put("/:id", healthLogController.update);
router.delete("/:id", healthLogController.remove);
router.post("/:id/share", healthLogController.share);
router.post("/:id/copy", healthLogController.copy);

export default router;
