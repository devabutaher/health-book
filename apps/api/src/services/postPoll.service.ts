import { prisma } from "../lib/prisma";
import { AppError } from "../utils/AppError";

export const postPollService = {
  async get(pollId: string, userId: string) {
    const poll = await prisma.postPoll.findUniqueOrThrow({
      where: { id: pollId },
      include: { votes: { select: { optionIndex: true, userId: true } } },
    });

    const totalVotes = poll.votes.length;
    const optionCounts = poll.options.map((_, idx) => ({
      optionIndex: idx,
      _count: poll.votes.filter((v) => v.optionIndex === idx).length,
    }));
    const userVote = poll.votes.find((v) => v.userId === userId)?.optionIndex ?? null;

    return {
      id: poll.id,
      postId: poll.postId,
      question: poll.question,
      options: poll.options,
      isMultipleChoice: poll.isMultipleChoice,
      expiresAt: poll.expiresAt,
      createdAt: poll.createdAt,
      votes: optionCounts,
      userVote,
      totalVotes,
    };
  },

  async vote(pollId: string, userId: string, optionIndex: number) {
    const poll = await prisma.postPoll.findUniqueOrThrow({
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

    await prisma.postPollVote.create({
      data: { pollId, userId, optionIndex },
    });

    const updated = await prisma.postPoll.findUniqueOrThrow({
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
      postId: updated.postId,
      question: updated.question,
      options: updated.options,
      votes: optionCounts,
      userVote: optionIndex,
      totalVotes,
    };
  },

  async unvote(pollId: string, userId: string) {
    const poll = await prisma.postPoll.findUniqueOrThrow({ where: { id: pollId } });

    if (poll.expiresAt && new Date() > poll.expiresAt) {
      throw new AppError(400, "Poll has expired");
    }

    const vote = await prisma.postPollVote.findFirst({
      where: { pollId, userId },
    });
    if (!vote) throw new AppError(404, "No vote found");

    await prisma.postPollVote.delete({ where: { id: vote.id } });

    const updated = await prisma.postPoll.findUniqueOrThrow({
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
      postId: updated.postId,
      question: updated.question,
      options: updated.options,
      votes: optionCounts,
      userVote: null,
      totalVotes,
    };
  },

  async remove(pollId: string, userId: string) {
    const poll = await prisma.postPoll.findUniqueOrThrow({
      where: { id: pollId },
      include: { post: { select: { userId: true } } },
    });

    if (poll.post.userId !== userId) {
      throw new AppError(403, "Only the post author can delete this poll");
    }

    await prisma.postPoll.delete({ where: { id: pollId } });
  },
};
