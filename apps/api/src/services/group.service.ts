import { prisma } from "../lib/prisma";
import { AppError } from "../utils/AppError";
import { deleteImage, extractPublicId } from "./cloudinary";
import type { GroupType, GroupRole } from "../../generated/prisma";

export const groupService = {
  async browse(userId: string | undefined, cursor?: string, limit = 20) {
    const groups = await prisma.group.findMany({
      where: {
        type: "PUBLIC",
        ...(userId ? { members: { none: { userId } } } : {}),
      },
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      include: {
        _count: { select: { members: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const hasMore = groups.length > limit;
    const items = hasMore ? groups.slice(0, limit) : groups;

    return {
      groups: items.map((g) => ({
        id: g.id,
        name: g.name,
        description: g.description,
        avatar: g.avatar,
        coverPhoto: g.coverPhoto,
        type: g.type,
        createdById: g.createdById,
        memberCount: g._count.members,
        isMember: false,
        myRole: null,
        createdAt: g.createdAt,
        updatedAt: g.updatedAt,
      })),
      nextCursor: hasMore ? items[items.length - 1]?.id : null,
      hasMore,
    };
  },

  async search(userId: string | undefined, query: string, cursor?: string, limit = 20) {
    const groups = await prisma.group.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
      },
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      include: {
        _count: { select: { members: true } },
        members: userId ? { where: { userId }, take: 1, select: { role: true } } : false,
      },
      orderBy: { createdAt: "desc" },
    });

    const hasMore = groups.length > limit;
    const items = hasMore ? groups.slice(0, limit) : groups;

    return {
      groups: items.map((g) => ({
        id: g.id,
        name: g.name,
        description: g.description,
        avatar: g.avatar,
        coverPhoto: g.coverPhoto,
        type: g.type,
        createdById: g.createdById,
        memberCount: g._count.members,
        isMember: Array.isArray(g.members) ? g.members.length > 0 : false,
        myRole: Array.isArray(g.members) && g.members.length > 0 ? g.members[0].role : null,
        createdAt: g.createdAt,
        updatedAt: g.updatedAt,
      })),
      nextCursor: hasMore ? items[items.length - 1]?.id : null,
      hasMore,
    };
  },

  async getMyGroups(userId: string) {
    const memberships = await prisma.groupMember.findMany({
      where: { userId },
      include: {
        group: {
          include: {
            _count: { select: { members: true } },
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });

    return memberships.map((m) => ({
      id: m.group.id,
      name: m.group.name,
      description: m.group.description,
      avatar: m.group.avatar,
      coverPhoto: m.group.coverPhoto,
      type: m.group.type,
      createdById: m.group.createdById,
      memberCount: m.group._count.members,
      isMember: true,
      myRole: m.role,
      createdAt: m.group.createdAt,
      updatedAt: m.group.updatedAt,
    }));
  },

  async getById(groupId: string, userId?: string) {
    const group = await prisma.group.findUniqueOrThrow({
      where: { id: groupId },
      include: {
        _count: { select: { members: true } },
        members: userId ? { where: { userId } } : false,
      },
    });

    if (group.type === "SECRET" && !userId) {
      throw new AppError(404, "Group not found");
    }

    if (group.type === "SECRET" && userId) {
      const isMember = Array.isArray(group.members) && group.members.length > 0;
      if (!isMember) throw new AppError(404, "Group not found");
    }

    const myMembership = Array.isArray(group.members) ? group.members[0] : null;

    return {
      id: group.id,
      name: group.name,
      description: group.description,
      avatar: group.avatar,
      coverPhoto: group.coverPhoto,
      type: group.type,
      createdById: group.createdById,
      memberCount: group._count.members,
      isMember: !!myMembership,
      myRole: myMembership?.role ?? null,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
    };
  },

  async create(data: {
    name: string;
    description?: string;
    avatar?: string;
    coverPhoto?: string;
    type?: GroupType;
    createdById: string;
  }) {
    return prisma.group.create({
      data: {
        name: data.name,
        description: data.description,
        avatar: data.avatar,
        coverPhoto: data.coverPhoto,
        type: data.type ?? "PUBLIC",
        createdById: data.createdById,
        members: {
          create: { userId: data.createdById, role: "ADMIN" },
        },
      },
    });
  },

  async update(
    groupId: string,
    userId: string,
    data: {
      name?: string;
      description?: string;
      avatar?: string;
      coverPhoto?: string;
      type?: GroupType;
    },
  ) {
    const membership = await prisma.groupMember.findUniqueOrThrow({
      where: { groupId_userId: { groupId, userId } },
    });
    if (membership.role !== "ADMIN")
      throw new AppError(403, "Only group admins can update the group");

    const existing = await prisma.group.findUnique({
      where: { id: groupId },
      select: { avatar: true, coverPhoto: true },
    });

    if (data.avatar && existing?.avatar && data.avatar !== existing.avatar) {
      const publicId = extractPublicId(existing.avatar);
      if (publicId) deleteImage(publicId).catch(() => {});
    }
    if (data.coverPhoto && existing?.coverPhoto && data.coverPhoto !== existing.coverPhoto) {
      const publicId = extractPublicId(existing.coverPhoto);
      if (publicId) deleteImage(publicId).catch(() => {});
    }

    return prisma.group.update({
      where: { id: groupId },
      data,
    });
  },

  async delete(groupId: string, userId: string) {
    const membership = await prisma.groupMember.findUniqueOrThrow({
      where: { groupId_userId: { groupId, userId } },
    });
    if (membership.role !== "ADMIN")
      throw new AppError(403, "Only group admins can delete the group");

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { avatar: true, coverPhoto: true },
    });
    if (group?.avatar) {
      const publicId = extractPublicId(group.avatar);
      if (publicId) deleteImage(publicId).catch(() => {});
    }
    if (group?.coverPhoto) {
      const publicId = extractPublicId(group.coverPhoto);
      if (publicId) deleteImage(publicId).catch(() => {});
    }

    await prisma.group.delete({ where: { id: groupId } });
  },

  async join(groupId: string, userId: string) {
    const group = await prisma.group.findUniqueOrThrow({ where: { id: groupId } });

    if (group.type === "SECRET") {
      throw new AppError(403, "Secret groups require an invite");
    }

    const existing = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (existing) throw new AppError(409, "Already a member");

    if (group.type === "PRIVATE") {
      throw new AppError(403, "Private groups require admin approval");
    }

    return prisma.groupMember.create({
      data: { groupId, userId, role: "MEMBER" },
    });
  },

  async leave(groupId: string, userId: string) {
    const membership = await prisma.groupMember.findUniqueOrThrow({
      where: { groupId_userId: { groupId, userId } },
    });
    if (membership.role === "ADMIN") {
      const adminCount = await prisma.groupMember.count({
        where: { groupId, role: "ADMIN" },
      });
      if (adminCount <= 1) {
        throw new AppError(400, "Transfer admin role to another member before leaving");
      }
    }

    await prisma.groupMember.delete({
      where: { groupId_userId: { groupId, userId } },
    });
  },

  async getMembers(groupId: string, requesterId: string | undefined, cursor?: string, limit = 50) {
    const group = await prisma.group.findUniqueOrThrow({ where: { id: groupId } });

    if (group.type === "SECRET" && !requesterId) {
      throw new AppError(404, "Group not found");
    }

    if (group.type === "SECRET" && requesterId) {
      const isMember = await prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId, userId: requesterId } },
      });
      if (!isMember) throw new AppError(404, "Group not found");
    }

    const members = await prisma.groupMember.findMany({
      where: { groupId },
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { groupId_userId: { groupId, userId: cursor } } } : {}),
      include: {
        user: { select: { id: true, name: true, username: true, avatar: true, isVerified: true } },
      },
      orderBy: [{ role: "asc" }, { joinedAt: "desc" }],
    });

    const hasMore = members.length > limit;
    const items = hasMore ? members.slice(0, limit) : members;

    return {
      members: items.map((m) => ({
        userId: m.userId,
        user: m.user,
        role: m.role,
        joinedAt: m.joinedAt,
      })),
      nextCursor: hasMore ? items[items.length - 1]?.userId : null,
      hasMore,
    };
  },

  async updateMemberRole(
    groupId: string,
    requesterId: string,
    targetUserId: string,
    role: GroupRole,
  ) {
    const requester = await prisma.groupMember.findUniqueOrThrow({
      where: { groupId_userId: { groupId, userId: requesterId } },
    });
    if (requester.role !== "ADMIN") throw new AppError(403, "Only admins can change roles");

    const target = await prisma.groupMember.findUniqueOrThrow({
      where: { groupId_userId: { groupId, userId: targetUserId } },
    });

    if (target.role === "ADMIN" && role !== "ADMIN") {
      const adminCount = await prisma.groupMember.count({
        where: { groupId, role: "ADMIN" },
      });
      if (adminCount <= 1) {
        throw new AppError(400, "Cannot demote the only admin. Promote another member first.");
      }
    }

    return prisma.groupMember.update({
      where: { groupId_userId: { groupId, userId: targetUserId } },
      data: { role },
      include: {
        user: { select: { id: true, name: true, username: true, avatar: true, isVerified: true } },
      },
    });
  },

  async removeMember(groupId: string, requesterId: string, targetUserId: string) {
    const requester = await prisma.groupMember.findUniqueOrThrow({
      where: { groupId_userId: { groupId, userId: requesterId } },
    });
    if (requester.role !== "ADMIN") throw new AppError(403, "Only admins can remove members");

    const target = await prisma.groupMember.findUniqueOrThrow({
      where: { groupId_userId: { groupId, userId: targetUserId } },
    });

    if (target.role === "ADMIN") {
      const adminCount = await prisma.groupMember.count({
        where: { groupId, role: "ADMIN" },
      });
      if (adminCount <= 1) {
        throw new AppError(400, "Cannot remove the only admin. Demote or promote another member first.");
      }
    }

    await prisma.groupMember.delete({
      where: { groupId_userId: { groupId, userId: targetUserId } },
    });
  },

  // ── Join Requests ──

  async requestJoin(groupId: string, userId: string) {
    const group = await prisma.group.findUniqueOrThrow({ where: { id: groupId } });

    if (group.type !== "PRIVATE") {
      throw new AppError(400, "Only private groups require a join request");
    }

    const existing = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (existing) throw new AppError(409, "Already a member");

    const existingRequest = await prisma.groupJoinRequest.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (existingRequest) {
      if (existingRequest.status === "PENDING")
        throw new AppError(409, "Join request already pending");
      if (existingRequest.status === "APPROVED") throw new AppError(409, "Already a member");
      await prisma.groupJoinRequest.update({
        where: { id: existingRequest.id },
        data: { status: "PENDING" },
      });
      return existingRequest;
    }

    return prisma.groupJoinRequest.create({
      data: { groupId, userId },
    });
  },

  async getJoinRequests(groupId: string, requesterId: string) {
    const membership = await prisma.groupMember.findUniqueOrThrow({
      where: { groupId_userId: { groupId, userId: requesterId } },
    });
    if (membership.role !== "ADMIN" && membership.role !== "MODERATOR") {
      throw new AppError(403, "Only admins and moderators can view join requests");
    }

    return prisma.groupJoinRequest.findMany({
      where: { groupId, status: "PENDING" },
      include: {
        user: { select: { id: true, name: true, username: true, avatar: true, isVerified: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async approveJoinRequest(groupId: string, requesterId: string, targetUserId: string) {
    const membership = await prisma.groupMember.findUniqueOrThrow({
      where: { groupId_userId: { groupId, userId: requesterId } },
    });
    if (membership.role !== "ADMIN" && membership.role !== "MODERATOR") {
      throw new AppError(403, "Only admins and moderators can approve requests");
    }

    const request = await prisma.groupJoinRequest.findUniqueOrThrow({
      where: { groupId_userId: { groupId, userId: targetUserId } },
    });
    if (request.status !== "PENDING") throw new AppError(400, "Request already processed");

    await prisma.$transaction([
      prisma.groupJoinRequest.update({
        where: { id: request.id },
        data: { status: "APPROVED" },
      }),
      prisma.groupMember.create({
        data: { groupId, userId: targetUserId, role: "MEMBER" },
      }),
    ]);

    return { message: "Request approved" };
  },

  async rejectJoinRequest(groupId: string, requesterId: string, targetUserId: string) {
    const membership = await prisma.groupMember.findUniqueOrThrow({
      where: { groupId_userId: { groupId, userId: requesterId } },
    });
    if (membership.role !== "ADMIN" && membership.role !== "MODERATOR") {
      throw new AppError(403, "Only admins and moderators can reject requests");
    }

    await prisma.groupJoinRequest.update({
      where: { groupId_userId: { groupId, userId: targetUserId } },
      data: { status: "REJECTED" },
    });

    return { message: "Request rejected" };
  },

  // ── Invites ──

  async inviteUser(groupId: string, requesterId: string, targetUserId: string) {
    const membership = await prisma.groupMember.findUniqueOrThrow({
      where: { groupId_userId: { groupId, userId: requesterId } },
    });
    if (membership.role !== "ADMIN" && membership.role !== "MODERATOR") {
      throw new AppError(403, "Only admins and moderators can invite users");
    }

    const existingMember = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: targetUserId } },
    });
    if (existingMember) throw new AppError(409, "User is already a member");

    const existingInvite = await prisma.groupInvite.findUnique({
      where: { groupId_userId: { groupId, userId: targetUserId } },
    });
    if (existingInvite && existingInvite.status === "PENDING") {
      throw new AppError(409, "User already has a pending invite");
    }

    return prisma.groupInvite.create({
      data: { groupId, userId: targetUserId, invitedBy: requesterId },
      include: {
        user: { select: { id: true, name: true, username: true, avatar: true, isVerified: true } },
      },
    });
  },

  async getMyInvites(userId: string) {
    return prisma.groupInvite.findMany({
      where: { userId, status: "PENDING" },
      include: {
        group: {
          include: {
            _count: { select: { members: true } },
          },
        },
        inviter: { select: { id: true, name: true, username: true, avatar: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async acceptInvite(inviteId: string, userId: string) {
    const invite = await prisma.groupInvite.findUniqueOrThrow({
      where: { id: inviteId },
    });
    if (invite.userId !== userId) throw new AppError(403, "Not your invite");
    if (invite.status !== "PENDING") throw new AppError(400, "Invite already processed");

    await prisma.$transaction([
      prisma.groupInvite.update({
        where: { id: inviteId },
        data: { status: "ACCEPTED" },
      }),
      prisma.groupMember.create({
        data: { groupId: invite.groupId, userId, role: "MEMBER" },
      }),
    ]);

    return { message: "Invite accepted" };
  },

  async declineInvite(inviteId: string, userId: string) {
    const invite = await prisma.groupInvite.findUniqueOrThrow({
      where: { id: inviteId },
    });
    if (invite.userId !== userId) throw new AppError(403, "Not your invite");
    if (invite.status !== "PENDING") throw new AppError(400, "Invite already processed");

    await prisma.groupInvite.update({
      where: { id: inviteId },
      data: { status: "DECLINED" },
    });

    return { message: "Invite declined" };
  },

  async getGroupInvites(groupId: string, requesterId: string) {
    const membership = await prisma.groupMember.findUniqueOrThrow({
      where: { groupId_userId: { groupId, userId: requesterId } },
    });
    if (membership.role !== "ADMIN" && membership.role !== "MODERATOR") {
      throw new AppError(403, "Only admins and moderators can view invites");
    }

    return prisma.groupInvite.findMany({
      where: { groupId },
      include: {
        user: { select: { id: true, name: true, username: true, avatar: true, isVerified: true } },
        inviter: { select: { id: true, name: true, username: true, avatar: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  },
};
