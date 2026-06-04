import { Router } from "express";
import { weightLogController } from "../controllers/weightLog.controller";
import { authenticate } from "../middleware";

const router = Router() as ReturnType<typeof Router>;

router.use(authenticate);

router.get("/history", weightLogController.history);
router.get("/", weightLogController.list);
router.post("/", weightLogController.create);
router.get("/:id", weightLogController.getById);
router.put("/:id", weightLogController.update);
router.delete("/:id", weightLogController.remove);

export default router;
