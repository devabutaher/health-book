import { Router } from "express";
import { postPollController } from "../controllers/postPoll.controller";
import { authenticate } from "../middleware";

const router = Router() as ReturnType<typeof Router>;
router.use(authenticate);

router.get("/:pollId", postPollController.get);
router.post("/:pollId/vote", postPollController.vote);
router.delete("/:pollId/vote", postPollController.unvote);
router.delete("/:pollId", postPollController.remove);

export default router;
