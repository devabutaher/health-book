import { Router } from "express";
import { challengeController } from "../controllers/challenge.controller";
import { authenticate } from "../middleware";
import { upload } from "../middleware/upload";

const router = Router() as ReturnType<typeof Router>;

// Static routes (must be before /:id)
router.get("/stats/:userId", authenticate, challengeController.getUserStats);
router.get("/stats", authenticate, challengeController.getUserStats);
router.post("/duel", authenticate, challengeController.createDuel);
router.post("/upload", authenticate, upload.single("image"), challengeController.uploadMedia);

// Browse & search
router.get("/", authenticate, challengeController.browse);
router.get("/search", authenticate, challengeController.search);
router.get("/saved", authenticate, challengeController.getSavedChallenges);
router.get("/mine", authenticate, challengeController.getMyChallenges);
router.get("/templates", challengeController.listTemplates);
router.post("/templates/seed", authenticate, challengeController.seedTemplates);

// Specific sub-routes (must be before /:id to avoid param capture)
router.get("/:id/duel", authenticate, challengeController.getDuel);
router.get("/:id/calendar", authenticate, challengeController.getCalendar);
router.get("/:id/before-after", authenticate, challengeController.getBeforeAfter);
router.get("/:id/activity", authenticate, challengeController.getActivityFeed);
router.get("/:id/leaderboard", challengeController.getLeaderboard);
router.get("/:id/comments", challengeController.getComments);
router.get("/:id/ratings", authenticate, challengeController.getRatings);
router.get("/:id/day-plan", authenticate, challengeController.getDayPlans);
router.get("/:id/day-plan/:day", authenticate, challengeController.getDayPlan);
router.put("/:id/day-plan/bulk", authenticate, challengeController.upsertDayPlans);
router.post("/:id/join", authenticate, challengeController.join);
router.delete("/:id/leave", authenticate, challengeController.leave);
router.post("/:id/check-in", authenticate, challengeController.checkIn);
router.post("/:id/save", authenticate, challengeController.toggleSave);
router.post("/:id/share", authenticate, challengeController.share);
router.post("/:id/invite", authenticate, challengeController.invite);
router.post("/:id/before-photo", authenticate, challengeController.uploadBeforePhoto);
router.post("/:id/after-photo", authenticate, challengeController.uploadAfterPhoto);
router.post("/:id/comments", authenticate, challengeController.addComment);
router.post("/:id/rate", authenticate, challengeController.rate);
router.put("/:id", authenticate, challengeController.update);
router.delete("/:id", authenticate, challengeController.remove);
router.post("/", authenticate, challengeController.create);

// Single challenge (must be after all sub-routes)
router.get("/:id", authenticate, challengeController.getById);

// Comments (commentId scoped)
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
