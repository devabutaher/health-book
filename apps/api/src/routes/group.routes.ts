import { Router } from "express";
import { groupController } from "../controllers/group.controller";
import { authenticate } from "../middleware";
import { upload } from "../middleware/upload";

const router = Router() as ReturnType<typeof Router>;

// Authenticated
router.get("/", authenticate, groupController.browse);
router.get("/search", authenticate, groupController.search);

// Authenticated (must be before /:id to avoid route conflict)
router.get("/my", authenticate, groupController.getMyGroups);
router.get("/my/invites", authenticate, groupController.getMyInvites);
router.put("/invites/:inviteId/accept", authenticate, groupController.acceptInvite);
router.put("/invites/:inviteId/decline", authenticate, groupController.declineInvite);

router.post("/", authenticate, groupController.create);
router.post("/media", authenticate, upload.single("image"), groupController.uploadMedia);

// Group-scoped (/:id)
router.get("/:id", authenticate, groupController.getById);
router.put("/:id", authenticate, groupController.update);
router.delete("/:id", authenticate, groupController.delete);
router.post("/:id/join", authenticate, groupController.join);
router.post("/:id/leave", authenticate, groupController.leave);

// Members
router.get("/:id/members", authenticate, groupController.getMembers);
router.put("/:id/members/:userId", authenticate, groupController.updateMemberRole);
router.delete("/:id/members/:userId", authenticate, groupController.removeMember);

// Join Requests
router.post("/:id/join-requests", authenticate, groupController.requestJoin);
router.get("/:id/join-requests", authenticate, groupController.getJoinRequests);
router.put("/:id/join-requests/:userId/approve", authenticate, groupController.approveJoinRequest);
router.put("/:id/join-requests/:userId/reject", authenticate, groupController.rejectJoinRequest);

// Invites
router.post("/:id/invite", authenticate, groupController.inviteUser);
router.get("/:id/invites", authenticate, groupController.getGroupInvites);

export default router;
