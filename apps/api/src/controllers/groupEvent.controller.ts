import type { Request, Response, NextFunction } from "express";
import { groupEventService } from "../services/groupEvent.service";

type P = Record<string, string>;

export const groupEventController = {
  async create(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const { title, description, date, location, maxAttendees } = req.body;
      const event = await groupEventService.create({
        groupId: req.params.groupId,
        createdById: req.user!.id,
        title,
        description,
        date,
        location,
        maxAttendees,
      });
      res.status(201).json({ success: true, data: event });
    } catch (err) {
      next(err);
    }
  },
  async list(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const events = await groupEventService.list(req.params.groupId, req.user!.id);
      res.json({ success: true, data: events });
    } catch (err) {
      next(err);
    }
  },
  async rsvp(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const data = await groupEventService.rsvp(req.params.eventId, req.user!.id, req.body.status);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },
  async remove(req: Request<P>, res: Response, next: NextFunction) {
    try {
      await groupEventService.remove(req.params.eventId, req.user!.id);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  },
};
