import { prisma } from "../lib/prisma";
import { AppError } from "../utils/AppError";

export const groupEventService = {
  async create(data: {
    groupId: string;
    createdById: string;
    title: string;
    description?: string;
    date: string;
    location?: string;
    maxAttendees?: number;
  }) {
    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: data.groupId, userId: data.createdById } },
    });
    if (!membership || (membership.role !== "ADMIN" && membership.role !== "MODERATOR")) {
      throw new AppError(403, "Only admins and moderators can create events");
    }

    return prisma.groupEvent.create({
      data: {
        groupId: data.groupId,
        createdById: data.createdById,
        title: data.title,
        description: data.description,
        date: new Date(data.date),
        location: data.location,
        maxAttendees: data.maxAttendees,
      },
      include: {
        rsvps: true,
        creator: { select: { id: true, name: true, username: true, avatar: true } },
      },
    });
  },

  async list(groupId: string, userId: string) {
    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (!membership) throw new AppError(403, "Not a member of this group");

    const events = await prisma.groupEvent.findMany({
      where: { groupId },
      include: {
        rsvps: true,
        creator: { select: { id: true, name: true, username: true, avatar: true } },
      },
      orderBy: { date: "asc" },
    });

    return events.map((event) => {
      const rsvpCounts = {
        GOING: event.rsvps.filter((r) => r.status === "GOING").length,
        MAYBE: event.rsvps.filter((r) => r.status === "MAYBE").length,
        NOT_GOING: event.rsvps.filter((r) => r.status === "NOT_GOING").length,
      };
      const myRsvp = event.rsvps.find((r) => r.userId === userId)?.status ?? null;

      return {
        id: event.id,
        groupId: event.groupId,
        createdById: event.createdById,
        creator: event.creator,
        title: event.title,
        description: event.description,
        date: event.date,
        location: event.location,
        maxAttendees: event.maxAttendees,
        rsvpCounts,
        myRsvp,
        createdAt: event.createdAt,
      };
    });
  },

  async rsvp(eventId: string, userId: string, status: string) {
    const event = await prisma.groupEvent.findUniqueOrThrow({ where: { id: eventId } });

    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: event.groupId, userId } },
    });
    if (!membership) throw new AppError(403, "Not a member of this group");

    if (!["GOING", "MAYBE", "NOT_GOING"].includes(status)) {
      throw new AppError(400, "Invalid RSVP status");
    }

    if (status === "GOING" && event.maxAttendees) {
      const goingCount = await prisma.groupEventRSVP.count({
        where: { eventId, status: "GOING" },
      });
      if (goingCount >= event.maxAttendees) {
        throw new AppError(400, "Event is full");
      }
    }

    await prisma.groupEventRSVP.upsert({
      where: { eventId_userId: { eventId, userId } },
      create: { eventId, userId, status },
      update: { status },
    });

    const updated = await prisma.groupEvent.findUniqueOrThrow({
      where: { id: eventId },
      include: {
        rsvps: true,
        creator: { select: { id: true, name: true, username: true, avatar: true } },
      },
    });

    const rsvpCounts = {
      GOING: updated.rsvps.filter((r) => r.status === "GOING").length,
      MAYBE: updated.rsvps.filter((r) => r.status === "MAYBE").length,
      NOT_GOING: updated.rsvps.filter((r) => r.status === "NOT_GOING").length,
    };

    return {
      id: updated.id,
      groupId: updated.groupId,
      createdById: updated.createdById,
      creator: updated.creator,
      title: updated.title,
      description: updated.description,
      date: updated.date,
      location: updated.location,
      maxAttendees: updated.maxAttendees,
      rsvpCounts,
      myRsvp: status,
      createdAt: updated.createdAt,
    };
  },

  async remove(eventId: string, userId: string) {
    const event = await prisma.groupEvent.findUniqueOrThrow({ where: { id: eventId } });

    if (event.createdById !== userId) {
      const membership = await prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId: event.groupId, userId } },
      });
      if (!membership || membership.role !== "ADMIN") {
        throw new AppError(403, "Only the event creator or group admin can delete this event");
      }
    }

    await prisma.groupEvent.delete({ where: { id: eventId } });
  },
};
