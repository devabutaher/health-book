import { Router } from "express";
import { notificationController } from "../controllers/notification.controller";
import { authenticate } from "../middleware";

const router = Router() as ReturnType<typeof Router>;

router.use(authenticate);

router.get("/unread-count", notificationController.unreadCount);
router.get("/", notificationController.list);
router.post("/read-all", notificationController.markAllRead);
router.post("/:id/read", notificationController.markRead);
router.delete("/:id", notificationController.deleteNotification);

export default router;
