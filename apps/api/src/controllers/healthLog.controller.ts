import type { Request, Response, NextFunction } from "express";
import {
  createHealthLogSchema,
  updateHealthLogSchema,
  shareHealthLogSchema,
} from "../utils/validators";
import { healthLogService } from "../services/healthLog.service";
import type { HealthLogType } from "../../generated/prisma";

export const healthLogController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { type, date, data, isPublic } = createHealthLogSchema.parse(req.body);
      const log = await healthLogService.create(
        req.user!.id,
        type,
        date || new Date().toISOString(),
        data,
        isPublic || false,
      );
      res.status(201).json({ success: true, data: log });
    } catch (err) {
      next(err);
    }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { type, limit, cursor } = req.query as Record<string, string | undefined>;
      const result = await healthLogService.list(req.user!.id, {
        type: type as HealthLogType | undefined,
        limit: limit ? parseInt(limit) : undefined,
        cursor,
      });
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const log = await healthLogService.getById(req.user!.id, req.params.id as string);
      res.json({ success: true, data: log });
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const body = updateHealthLogSchema.parse(req.body);
      const log = await healthLogService.update(req.user!.id, req.params.id as string, body);
      res.json({ success: true, data: log });
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await healthLogService.remove(req.user!.id, req.params.id as string);
      res.json({ success: true, message: "Health log deleted" });
    } catch (err) {
      next(err);
    }
  },

  async copy(req: Request, res: Response, next: NextFunction) {
    try {
      const log = await healthLogService.copyToMyBook(req.user!.id, req.params.id as string);
      res.status(201).json({ success: true, data: log });
    } catch (err) {
      next(err);
    }
  },

  async share(req: Request, res: Response, next: NextFunction) {
    try {
      const { content } = shareHealthLogSchema.parse(req.body);
      const post = await healthLogService.share(req.user!.id, req.params.id as string, content);
      res.status(201).json({ success: true, data: post });
    } catch (err) {
      next(err);
    }
  },

  async trends(req: Request, res: Response, next: NextFunction) {
    try {
      const days = parseInt(req.query.days as string) || 90;
      const data = await healthLogService.getTrends(req.user!.id, days);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async stats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await healthLogService.getStats(req.user!.id);
      res.json({ success: true, data: stats });
    } catch (err) {
      next(err);
    }
  },

  async calendar(req: Request, res: Response, next: NextFunction) {
    try {
      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
      const data = await healthLogService.getCalendar(req.user!.id, year, month);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },
};
