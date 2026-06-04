import { prisma } from "../lib/prisma";
import { AppError } from "../utils/AppError";

export const groupPollService = {
  async create(data: {
    groupId: string;
    createdById: string;
    question: string;
    options: string[];
    isMultipleChoice?: boolean;
    expiresAt?: string;
  }) {
    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: data.groupId, userId: data.createdById } },
    });
    if (!membership || (membership.role !== "ADMIN" && membership.role !== "MODERATOR")) {
      throw new AppError(403, "Only admins and moderators can create polls");
    }

    if (data.options.length < 2) throw new AppError(400, "At least 2 options required");
    if (data.options.length > 10) throw new AppError(400, "Maximum 10 options allowed");

    return prisma.groupPoll.create({
      data: {
        groupId: data.groupId,
        createdById: data.createdById,
        question: data.question,
        options: data.options,
        isMultipleChoice: data.isMultipleChoice ?? false,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
      include: {
        votes: { select: { optionIndex: true, userId: true } },
      },
    });
  },

  async list(groupId: string, userId: string) {
    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (!membership) throw new AppError(403, "Not a member of this group");

    const polls = await prisma.groupPoll.findMany({
      where: { groupId },
      include: {
        votes: { select: { optionIndex: true, userId: true } },
        creator: { select: { id: true, name: true, username: true, avatar: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return polls.map((poll) => {
      const totalVotes = poll.votes.length;
      const optionCounts = poll.options.map((_, idx) => ({
        optionIndex: idx,
        _count: poll.votes.filter((v) => v.optionIndex === idx).length,
      }));
      const userVote = poll.votes.find((v) => v.userId === userId)?.optionIndex ?? null;

      return {
        id: poll.id,
        groupId: poll.groupId,
        createdById: poll.createdById,
        creator: poll.creator,
        question: poll.question,
        options: poll.options,
        isMultipleChoice: poll.isMultipleChoice,
        expiresAt: poll.expiresAt,
        createdAt: poll.createdAt,
        votes: optionCounts,
        userVote,
        totalVotes,
      };
    });
  },

  async vote(pollId: string, userId: string, optionIndex: number) {
    const poll = await prisma.groupPoll.findUniqueOrThrow({
      where: { id: pollId },
      include: { votes: true },
    });

    if (poll.expiresAt && new Date() > poll.expiresAt) {
      throw new AppError(400, "Poll has expired");
    }

    if (optionIndex < 0 || optionIndex >= poll.options.length) {
      throw new AppError(400, "Invalid option");
    }

    if (!poll.isMultipleChoice) {
      const existing = poll.votes.find((v) => v.userId === userId);
      if (existing) throw new AppError(409, "Already voted");
    }

    const alreadyVotedOption = poll.votes.find(
      (v) => v.userId === userId && v.optionIndex === optionIndex,
    );
    if (alreadyVotedOption) throw new AppError(409, "Already voted for this option");

    await prisma.groupPollVote.create({
      data: { pollId, userId, optionIndex },
    });

    const updated = await prisma.groupPoll.findUniqueOrThrow({
      where: { id: pollId },
      include: { votes: { select: { optionIndex: true, userId: true } } },
    });

    const totalVotes = updated.votes.length;
    const optionCounts = updated.options.map((_, idx) => ({
      optionIndex: idx,
      _count: updated.votes.filter((v) => v.optionIndex === idx).length,
    }));

    return {
      id: updated.id,
      groupId: updated.groupId,
      question: updated.question,
      options: updated.options,
      votes: optionCounts,
      userVote: optionIndex,
      totalVotes,
    };
  },

  async remove(pollId: string, userId: string) {
    const poll = await prisma.groupPoll.findUniqueOrThrow({ where: { id: pollId } });

    if (poll.createdById !== userId) {
      const membership = await prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId: poll.groupId, userId } },
      });
      if (!membership || membership.role !== "ADMIN") {
        throw new AppError(403, "Only the poll creator or group admin can delete this poll");
      }
    }

    await prisma.groupPoll.delete({ where: { id: pollId } });
  },

  async unvote(pollId: string, userId: string) {
    const poll = await prisma.groupPoll.findUniqueOrThrow({ where: { id: pollId } });

    if (poll.expiresAt && new Date() > poll.expiresAt) {
      throw new AppError(400, "Poll has expired");
    }

    const vote = await prisma.groupPollVote.findFirst({
      where: { pollId, userId },
    });
    if (!vote) throw new AppError(404, "No vote found");

    await prisma.groupPollVote.delete({ where: { id: vote.id } });

    const updated = await prisma.groupPoll.findUniqueOrThrow({
      where: { id: pollId },
      include: { votes: { select: { optionIndex: true, userId: true } } },
    });

    const totalVotes = updated.votes.length;
    const optionCounts = updated.options.map((_, idx) => ({
      optionIndex: idx,
      _count: updated.votes.filter((v) => v.optionIndex === idx).length,
    }));

    return {
      id: updated.id,
      groupId: updated.groupId,
      question: updated.question,
      options: updated.options,
      votes: optionCounts,
      userVote: null,
      totalVotes,
    };
  },
};
