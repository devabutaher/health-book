import { Router } from "express";
import { groupEventController } from "../controllers/groupEvent.controller";
import { authenticate } from "../middleware";

const router = Router() as ReturnType<typeof Router>;
router.use(authenticate);

router.post("/:groupId/events", groupEventController.create);
router.get("/:groupId/events", groupEventController.list);
router.post("/:groupId/events/:eventId/rsvp", groupEventController.rsvp);
router.delete("/:groupId/events/:eventId", groupEventController.remove);

export default router;
