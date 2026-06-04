import type { Request, Response, NextFunction } from "express";
import {
  createGroupSchema,
  updateGroupSchema,
  updateMemberRoleSchema,
  inviteUserSchema,
} from "../utils/validators";
import { groupService } from "../services/group.service";
import { uploadImage } from "../services/cloudinary";
import { prisma } from "../lib/prisma";

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

type P = Record<string, string>;

export const groupController = {
  async browse(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const cursor = req.query.cursor as string | undefined;
      const limit = Number(req.query.limit) || 20;
      const result = await groupService.browse(req.user?.id, cursor, limit);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async search(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const query = req.query.q as string;
      if (!query?.trim()) {
        return res.status(400).json({ success: false, message: "Search query required" });
      }
      const cursor = req.query.cursor as string | undefined;
      const limit = Number(req.query.limit) || 20;
      const result = await groupService.search(req.user?.id, query.trim(), cursor, limit);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async getMyGroups(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const groups = await groupService.getMyGroups(req.user!.id);
      res.json({ success: true, data: groups });
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const group = await groupService.getById(req.params.id, req.user?.id);
      res.json({ success: true, data: group });
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const data = createGroupSchema.parse(req.body);
      const group = await groupService.create({ ...data, createdById: req.user!.id });
      res.status(201).json({ success: true, data: group });
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const data = updateGroupSchema.parse(req.body);
      const group = await groupService.update(req.params.id, req.user!.id, data);
      res.json({ success: true, data: group });
    } catch (err) {
      next(err);
    }
  },

  async delete(req: Request<P>, res: Response, next: NextFunction) {
    try {
      await groupService.delete(req.params.id, req.user!.id);
      res.json({ success: true, message: "Group deleted" });
    } catch (err) {
      next(err);
    }
  },

  async join(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const result = await groupService.join(req.params.id, req.user!.id);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async leave(req: Request<P>, res: Response, next: NextFunction) {
    try {
      await groupService.leave(req.params.id, req.user!.id);
      res.json({ success: true, message: "Left group" });
    } catch (err) {
      next(err);
    }
  },

  async getMembers(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const cursor = req.query.cursor as string | undefined;
      const limit = Number(req.query.limit) || 50;
      const result = await groupService.getMembers(req.params.id, req.user?.id, cursor, limit);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async updateMemberRole(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const { role } = updateMemberRoleSchema.parse(req.body);
      const result = await groupService.updateMemberRole(
        req.params.id,
        req.user!.id,
        req.params.userId,
        role,
      );
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async removeMember(req: Request<P>, res: Response, next: NextFunction) {
    try {
      await groupService.removeMember(req.params.id, req.user!.id, req.params.userId);
      res.json({ success: true, message: "Member removed" });
    } catch (err) {
      next(err);
    }
  },

  // ── Join Requests ──

  async requestJoin(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const result = await groupService.requestJoin(req.params.id, req.user!.id);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async getJoinRequests(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const result = await groupService.getJoinRequests(req.params.id, req.user!.id);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async approveJoinRequest(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const result = await groupService.approveJoinRequest(
        req.params.id,
        req.user!.id,
        req.params.userId,
      );
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async rejectJoinRequest(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const result = await groupService.rejectJoinRequest(
        req.params.id,
        req.user!.id,
        req.params.userId,
      );
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  // ── Invites ──

  async inviteUser(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const { userId } = inviteUserSchema.parse(req.body);
      // Resolve username to UUID if not already a UUID
      const targetId = userId.includes("-")
        ? userId
        : (await prisma.user.findUnique({ where: { username: userId }, select: { id: true } }))?.id;
      if (!targetId) return res.status(404).json({ success: false, message: "User not found" });
      const result = await groupService.inviteUser(req.params.id, req.user!.id, targetId);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async getMyInvites(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const result = await groupService.getMyInvites(req.user!.id);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async acceptInvite(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const result = await groupService.acceptInvite(req.params.inviteId, req.user!.id);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async declineInvite(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const result = await groupService.declineInvite(req.params.inviteId, req.user!.id);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async getGroupInvites(req: Request<P>, res: Response, next: NextFunction) {
    try {
      const result = await groupService.getGroupInvites(req.params.id, req.user!.id);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async uploadMedia(req: Request & { file?: MulterFile }, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "No file provided" });
      }
      const url = await uploadImage(req.file.path, "groups");
      res.json({ success: true, data: { url } });
    } catch (err) {
      next(err);
    }
  },
};
