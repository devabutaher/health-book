import { Router } from "express";
import { messageController } from "../controllers/message.controller";
import { authenticate, cacheControl } from "../middleware";

const router = Router() as ReturnType<typeof Router>;

router.use(authenticate);

router.get("/unread-count", cacheControl(10, 30), messageController.unreadCount);
router.get("/conversations", cacheControl(60, 300), messageController.listConversations);
router.post("/conversations", messageController.createConversation);
router.get("/conversations/:id", cacheControl(60, 300), messageController.getConversation);
router.post("/conversations/:id/messages", messageController.sendMessage);
router.post("/conversations/:id/mute", messageController.toggleMute);
router.post("/conversations/:id/read", messageController.markRead);
router.delete("/conversations/:id", messageController.deleteConversation);
router.delete("/conversations/:id/messages", messageController.clearMessages);
router.delete("/messages/:messageId", messageController.deleteMessage);
router.post("/conversations/:id/promote/:userId", messageController.promoteToAdmin);
router.post("/conversations/:id/participants", messageController.addParticipant);
router.delete("/conversations/:id/participants/:userId", messageController.removeParticipant);
router.patch("/conversations/:id/group-info", messageController.updateGroupInfo);

export default router;
