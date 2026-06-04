import { Router } from "express";
import { highlightController } from "../controllers/highlight.controller";
import { authenticate } from "../middleware";

const router = Router() as ReturnType<typeof Router>;

router.use(authenticate);

router.get("/", highlightController.getAll);
router.post("/", highlightController.create);
router.put("/:id", highlightController.update);
router.delete("/:id", highlightController.delete);
router.post("/:id/items", highlightController.addItem);
router.delete("/:id/items/:itemId", highlightController.removeItem);
router.put("/:id/items/reorder", highlightController.reorderItems);

export default router;
