import { Router } from "express";
import { groupPollController } from "../controllers/groupPoll.controller";
import { authenticate } from "../middleware";

const router = Router() as ReturnType<typeof Router>;
router.use(authenticate);

router.post("/:groupId/polls", groupPollController.create);
router.get("/:groupId/polls", groupPollController.list);
router.post("/:groupId/polls/:pollId/vote", groupPollController.vote);
router.delete("/:groupId/polls/:pollId", groupPollController.remove);
router.delete("/:groupId/polls/:pollId/vote", groupPollController.unvote);

export default router;
