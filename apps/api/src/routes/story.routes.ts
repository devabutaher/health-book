import { Router } from "express";
import { storyController } from "../controllers/story.controller";
import { authenticate } from "../middleware";

const router = Router() as ReturnType<typeof Router>;

router.use(authenticate);

router.post("/", storyController.create);
router.get("/friends", storyController.getFriendsStories);
router.post("/:id/view", storyController.addView);
router.delete("/:id", storyController.delete);

router.post("/:id/react", storyController.react);
router.get("/:id/interactions", storyController.getInteractions);

router.post("/:id/vote", storyController.votePoll);
router.get("/:id/poll-results", storyController.getPollResults);

export default router;
