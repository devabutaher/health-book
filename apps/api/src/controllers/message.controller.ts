import type { Request, Response, NextFunction } from "express";
import { createConversationSchema, sendMessageSchema } from "../utils/validators";
import { messageService } from "../services/message.service";

type P = Record<string, string>;

export const messageController = {
  async unreadCount(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const count = await messageService.getTotalUnreadCount(req.user!.id);
      res.json({ success: true, data: { count } });
    } catch (err) {
      next(err);
    }
  },

  async listConversations(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const conversations = await messageService.listConversations(req.user!.id);
      res.json({ success: true, data: conversations });
    } catch (err) {
      next(err);
    }
  },

  async createConversation(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const { participantIds, isGroup, groupName } = createConversationSchema.parse(req.body);
      const conversation = await messageService.createConversation(
        req.user!.id,
        participantIds,
        isGroup,
        groupName,
      );
      res.status(201).json({ success: true, data: conversation });
    } catch (err) {
      next(err);
    }
  },

  async getConversation(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const cursor = req.query.cursor as string | undefined;
      const limit = Number(req.query.limit) || 50;
      const result = await messageService.getConversation(
        req.params.id,
        req.user!.id,
        cursor,
        limit,
      );
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async sendMessage(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const data = sendMessageSchema.parse(req.body);
      const message = await messageService.sendMessage(req.params.id, req.user!.id, data);
      res.status(201).json({ success: true, data: message });
    } catch (err) {
      next(err);
    }
  },

  async deleteMessage(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const deleteForAll = req.query.forAll === "true";
      await messageService.deleteMessage(req.params.messageId, req.user!.id, deleteForAll);
      res.json({ success: true, message: "Message deleted" });
    } catch (err) {
      next(err);
    }
  },

  async toggleMute(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const result = await messageService.toggleMute(req.params.id, req.user!.id);
      res.json({ success: true, data: { isMuted: result.isMuted } });
    } catch (err) {
      next(err);
    }
  },

  async markRead(req: Request<P>, res: Response, next: NextFunction) {
    try {
      await messageService.markRead(req.params.id, req.user!.id);
      res.json({ success: true, message: "Marked as read" });
    } catch (err) {
      next(err);
    }
  },

  async deleteConversation(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const deleteForEveryone = req.query.forEveryone === "true";
      await messageService.deleteConversation(req.params.id, req.user!.id, deleteForEveryone);
      res.json({ success: true, message: "Conversation deleted" });
    } catch (err) {
      next(err);
    }
  },

  async promoteToAdmin(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const result = await messageService.promoteToAdmin(
        req.params.id,
        req.params.userId,
        req.user!.id,
      );
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async clearMessages(req: Request<P>, res: Response, next: NextFunction) {
    try {
      await messageService.clearMessages(req.params.id, req.user!.id);
      res.json({ success: true, message: "Messages cleared" });
    } catch (err) {
      next(err);
    }
  },

  async addParticipant(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const { userId } = req.body;
      const participant = await messageService.addParticipant(req.params.id, userId, req.user!.id);
      res.status(201).json({ success: true, data: participant });
    } catch (err) {
      next(err);
    }
  },

  async removeParticipant(req: Request<P>, res: Response, next: NextFunction) {
    try {
      await messageService.removeParticipant(req.params.id, req.params.userId, req.user!.id);
      res.json({ success: true, message: "Participant removed" });
    } catch (err) {
      next(err);
    }
  },

  async updateGroupInfo(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const conversation = await messageService.updateGroupInfo(
        req.params.id,
        req.body,
        req.user!.id,
      );
      res.json({ success: true, data: conversation });
    } catch (err) {
      next(err);
    }
  },
};
