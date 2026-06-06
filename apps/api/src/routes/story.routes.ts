import { Router } from "express";
import { storyController } from "../controllers/story.controller";
import { authenticate, cacheControl } from "../middleware";

const router = Router() as ReturnType<typeof Router>;

router.use(authenticate);

router.post("/", storyController.create);
router.get("/friends", cacheControl(60, 300), storyController.getFriendsStories);
router.post("/:id/view", storyController.addView);
router.delete("/:id", storyController.delete);

router.post("/:id/react", storyController.react);
router.get("/:id/interactions", cacheControl(60, 300), storyController.getInteractions);

router.post("/:id/vote", storyController.votePoll);
router.get("/:id/poll-results", cacheControl(60, 300), storyController.getPollResults);

export default router;
