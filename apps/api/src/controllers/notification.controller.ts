import type { Request, Response, NextFunction } from "express";
import { notificationService } from "../services/notification.service";

export const notificationController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { cursor, limit } = req.query as Record<string, string | undefined>;
      const result = await notificationService.list(
        req.user!.id,
        cursor,
        limit ? parseInt(limit) : undefined,
      );
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  async markRead(req: Request, res: Response, next: NextFunction) {
    try {
      const notif = await notificationService.markRead(req.user!.id, req.params.id as string);
      res.json({ success: true, data: notif });
    } catch (err) {
      next(err);
    }
  },

  async markAllRead(req: Request, res: Response, next: NextFunction) {
    try {
      await notificationService.markAllRead(req.user!.id);
      res.json({ success: true, message: "All notifications marked as read" });
    } catch (err) {
      next(err);
    }
  },

  async unreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const count = await notificationService.getUnreadCount(req.user!.id);
      res.json({ success: true, data: { count } });
    } catch (err) {
      next(err);
    }
  },

  async deleteNotification(req: Request, res: Response, next: NextFunction) {
    try {
      await notificationService.delete(req.user!.id, req.params.id as string);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  },
};
