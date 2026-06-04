import type { Request, Response, NextFunction } from "express";
import { createWeightLogSchema, updateWeightLogSchema } from "../utils/validators";
import { weightLogService } from "../services/weightLog.service";

export const weightLogController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { weight, date, notes, bodyFat, waist, hips, chest, arms } =
        createWeightLogSchema.parse(req.body);
      const log = await weightLogService.create(req.user!.id, {
        weight,
        date,
        notes,
        bodyFat,
        waist,
        hips,
        chest,
        arms,
      });
      res.status(201).json({ success: true, data: log });
    } catch (err) {
      next(err);
    }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { limit, cursor } = req.query as Record<string, string | undefined>;
      const result = await weightLogService.list(req.user!.id, {
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
      const log = await weightLogService.getById(req.user!.id, req.params.id as string);
      res.json({ success: true, data: log });
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const body = updateWeightLogSchema.parse(req.body);
      const log = await weightLogService.update(req.user!.id, req.params.id as string, body);
      res.json({ success: true, data: log });
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await weightLogService.remove(req.user!.id, req.params.id as string);
      res.json({ success: true, message: "Weight log deleted" });
    } catch (err) {
      next(err);
    }
  },

  async history(req: Request, res: Response, next: NextFunction) {
    try {
      const days = parseInt(req.query.days as string) || 90;
      const data = await weightLogService.getHistory(req.user!.id, days);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },
};
