import { Router } from "express";
import { challengeController } from "../controllers/challenge.controller";
import { authenticate } from "../middleware";

const router = Router() as ReturnType<typeof Router>;

// Static routes (must be before /:id)
router.get("/stats/:userId", authenticate, challengeController.getUserStats);
router.get("/stats", authenticate, challengeController.getUserStats);
router.post("/duel", authenticate, challengeController.createDuel);

// Browse & search
router.get("/", authenticate, challengeController.browse);
router.get("/search", authenticate, challengeController.search);
router.get("/saved", authenticate, challengeController.getSavedChallenges);
router.get("/mine", authenticate, challengeController.getMyChallenges);
router.get("/templates", challengeController.listTemplates);
router.post("/templates/seed", authenticate, challengeController.seedTemplates);

// Single challenge
router.get("/:id", authenticate, challengeController.getById);
router.get("/:id/duel", authenticate, challengeController.getDuel);
router.put("/:id", authenticate, challengeController.update);
router.delete("/:id", authenticate, challengeController.remove);
router.post("/", authenticate, challengeController.create);

// Participation
router.post("/:id/join", authenticate, challengeController.join);
router.delete("/:id/leave", authenticate, challengeController.leave);
router.post("/:id/check-in", authenticate, challengeController.checkIn);
router.get("/:id/calendar", authenticate, challengeController.getCalendar);
router.get("/:id/before-after", authenticate, challengeController.getBeforeAfter);
router.get("/:id/activity", authenticate, challengeController.getActivityFeed);

// Leaderboard
router.get("/:id/leaderboard", challengeController.getLeaderboard);

// Social
router.post("/:id/save", authenticate, challengeController.toggleSave);
router.post("/:id/share", authenticate, challengeController.share);
router.post("/:id/invite", authenticate, challengeController.invite);

// Comments
router.get("/:id/comments", challengeController.getComments);
router.post("/:id/comments", authenticate, challengeController.addComment);
router.post("/comments/:commentId/react", authenticate, challengeController.reactToComment);
router.delete(
  "/comments/:commentId/react",
  authenticate,
  challengeController.removeCommentReaction,
);
router.delete("/comments/:commentId", authenticate, challengeController.deleteComment);

// Invites
router.get("/invites/mine", authenticate, challengeController.getMyInvites);
router.put("/invites/:inviteId", authenticate, challengeController.respondToInvite);

export default router;
