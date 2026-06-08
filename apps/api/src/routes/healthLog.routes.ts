import { Router } from "express";
import { healthLogController } from "../controllers/healthLog.controller";
import { authenticate } from "../middleware";

const router = Router() as ReturnType<typeof Router>;

router.use(authenticate);

router.get("/trends", healthLogController.trends);
router.get("/stats", healthLogController.stats);
router.get("/calendar", healthLogController.calendar);
router.get("/", healthLogController.list);
router.post("/", healthLogController.create);
router.get("/:id", healthLogController.getById);
router.put("/:id", healthLogController.update);
router.delete("/:id", healthLogController.remove);
router.post("/:id/share", healthLogController.share);
router.post("/:id/copy", healthLogController.copy);

export default router;
