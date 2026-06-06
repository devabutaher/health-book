import { Router } from "express";
import { challengeController } from "../controllers/challenge.controller";
import { authenticate, cacheControl } from "../middleware";

const router = Router() as ReturnType<typeof Router>;

// Static routes (must be before /:id)
router.get("/stats/:userId", authenticate, cacheControl(60, 300), challengeController.getUserStats);
router.get("/stats", authenticate, cacheControl(60, 300), challengeController.getUserStats);
router.post("/duel", authenticate, challengeController.createDuel);

// Browse & search
router.get("/", authenticate, cacheControl(300, 600), challengeController.browse);
router.get("/search", authenticate, cacheControl(60, 300), challengeController.search);
router.get("/saved", authenticate, cacheControl(60, 300), challengeController.getSavedChallenges);
router.get("/mine", authenticate, cacheControl(60, 300), challengeController.getMyChallenges);
router.get("/templates", cacheControl(600, 1200, true), challengeController.listTemplates);
router.post("/templates/seed", authenticate, challengeController.seedTemplates);

// Single challenge
router.get("/:id", authenticate, cacheControl(300, 600), challengeController.getById);
router.get("/:id/duel", authenticate, cacheControl(60, 300), challengeController.getDuel);
router.put("/:id", authenticate, challengeController.update);
router.delete("/:id", authenticate, challengeController.remove);
router.post("/", authenticate, challengeController.create);

// Participation
router.post("/:id/join", authenticate, challengeController.join);
router.delete("/:id/leave", authenticate, challengeController.leave);
router.post("/:id/check-in", authenticate, challengeController.checkIn);
router.get("/:id/calendar", authenticate, cacheControl(60, 300), challengeController.getCalendar);
router.get("/:id/before-after", authenticate, cacheControl(60, 300), challengeController.getBeforeAfter);
router.get("/:id/activity", authenticate, cacheControl(10, 30), challengeController.getActivityFeed);

// Leaderboard
router.get("/:id/leaderboard", cacheControl(60, 300), challengeController.getLeaderboard);

// Social
router.post("/:id/save", authenticate, challengeController.toggleSave);
router.post("/:id/share", authenticate, challengeController.share);
router.post("/:id/invite", authenticate, challengeController.invite);

// Comments
router.get("/:id/comments", cacheControl(10, 30), challengeController.getComments);
router.post("/:id/comments", authenticate, challengeController.addComment);
router.post("/comments/:commentId/react", authenticate, challengeController.reactToComment);
router.delete(
  "/comments/:commentId/react",
  authenticate,
  challengeController.removeCommentReaction,
);
router.delete("/comments/:commentId", authenticate, challengeController.deleteComment);

// Invites
router.get("/invites/mine", authenticate, cacheControl(60, 300), challengeController.getMyInvites);
router.put("/invites/:inviteId", authenticate, challengeController.respondToInvite);

export default router;
