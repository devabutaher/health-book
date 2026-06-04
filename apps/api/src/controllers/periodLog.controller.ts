import type { Request, Response, NextFunction } from "express";
import { createPeriodLogSchema, updatePeriodLogSchema } from "../utils/validators";
import { periodLogService } from "../services/periodLog.service";

export const periodLogController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate, cycleLength, flowIntensity, symptoms, notes } =
        createPeriodLogSchema.parse(req.body);
      const log = await periodLogService.create(req.user!.id, {
        startDate,
        endDate,
        cycleLength,
        flowIntensity,
        symptoms,
        notes,
      });
      res.status(201).json({ success: true, data: log });
    } catch (err) {
      next(err);
    }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { limit, cursor } = req.query as Record<string, string | undefined>;
      const result = await periodLogService.list(req.user!.id, {
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
      const log = await periodLogService.getById(req.user!.id, req.params.id as string);
      res.json({ success: true, data: log });
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const body = updatePeriodLogSchema.parse(req.body);
      const log = await periodLogService.update(req.user!.id, req.params.id as string, body);
      res.json({ success: true, data: log });
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await periodLogService.remove(req.user!.id, req.params.id as string);
      res.json({ success: true, message: "Period log deleted" });
    } catch (err) {
      next(err);
    }
  },
};
