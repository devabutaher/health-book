import { prisma } from "../lib/prisma";
import { supabase } from "../lib/supabase";
import { AppError } from "../utils/AppError";
import { notificationService } from "./notification.service";
import { postService } from "./post.service";
import type {
  ChallengeType,
  ChallengeCategory,
  ChallengeDifficulty,
  Challenge,
  ChallengeParticipant,
} from "../../generated/prisma";
import { Prisma, $Enums } from "../../generated/prisma";

const DEFAULT_DAY_COUNT = 30;

interface ChallengeWithRelations extends Challenge {
  _count?: { participants: number };
  participants?: ChallengeParticipant[];
  group?: { id: string; name: string } | null;
  createdBy?: { id: string; name: string; username: string; avatar: string | null };
  savedBy?: { userId: string }[];
  dayEntries?: {
    id: string;
    dayNumber: number;
    completed: boolean;
    mediaUrls: string[];
    value?: number | null;
  }[];
}

async function computeScore(challengeId: string, userId: string): Promise<number> {
  return prisma.challengeDayEntry.count({
    where: { challengeId, userId, completed: true },
  });
}

async function computeStreak(challengeId: string, userId: string): Promise<number> {
  const entries = await prisma.challengeDayEntry.findMany({
    where: { challengeId, userId, completed: true },
    orderBy: { dayNumber: "desc" },
    select: { dayNumber: true },
  });

  if (entries.length === 0) return 0;

  let streak = 1;
  for (let i = 1; i < entries.length; i++) {
    if (entries[i]!.dayNumber === entries[i - 1]!.dayNumber - 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

function getDayCount(c: Challenge): number {
  return c.dayCount || DEFAULT_DAY_COUNT;
}

async function createActivity(data: {
  challengeId: string;
  userId: string;
  type: string;
  message: string;
  metadata?: Record<string, unknown>;
}) {
  return prisma.challengeActivity.create({
    data: {
      challengeId: data.challengeId,
      userId: data.userId,
      type: data.type,
      message: data.message,
      metadata: (data.metadata ?? Prisma.JsonNull) as Prisma.InputJsonValue,
    },
  });
}

async function checkMilestones(
  challengeId: string,
  userId: string,
  previousAchieved: string[],
): Promise<string[]> {
  const challenge = await prisma.challenge.findUniqueOrThrow({
    where: { id: challengeId },
    select: { milestones: true },
  });
  const milestones =
    (challenge.milestones as { name: string; threshold: number; icon: string }[]) || [];
  const score = await computeScore(challengeId, userId);
  const newlyAchieved: string[] = [];
  for (const m of milestones) {
    if (score >= m.threshold && !previousAchieved.includes(m.name)) {
      newlyAchieved.push(m.name);
    }
  }
  return newlyAchieved;
}

async function broadcastRealtime(
  challengeId: string,
  event: string,
  payload: Record<string, unknown>,
) {
  try {
    const channel = supabase.channel(`challenge:${challengeId}`);
    await new Promise<void>((resolve, reject) => {
      const t = setTimeout(() => reject(new Error("timeout")), 3000);
      channel.subscribe((status) => {
        if (status === "SUBSCRIBED") {
          clearTimeout(t);
          resolve();
        }
        if (status === "CHANNEL_ERROR") {
          clearTimeout(t);
          reject(new Error("channel_error"));
        }
      });
    });
    channel.send({ type: "broadcast", event, payload });
    channel.unsubscribe();
  } catch {}
}

function formatChallenge(
  c: ChallengeWithRelations,
  myParticipation: ChallengeParticipant | null,
  userId?: string,
) {
  return {
    id: c.id,
    title: c.title,
    description: c.description,
    type: c.type,
    difficulty: c.difficulty || "BEGINNER",
    dayCount: c.dayCount || DEFAULT_DAY_COUNT,
    groupId: c.groupId,
    group: c.group,
    createdById: c.createdById,
    createdBy: c.createdBy || null,
    startDate: c.startDate,
    endDate: c.endDate,
    entryFee: c.entryFee,
    prize: c.prize,
    goalTarget: c.goalTarget,
    goalUnit: c.goalUnit,
    category: c.category || "GENERAL",
    milestones: c.milestones as { name: string; threshold: number; icon: string }[] | null,
    participantCount: c._count?.participants ?? 0,
    isJoined: !!myParticipation,
    isSaved: userId ? (c.savedBy?.length ?? 0) > 0 : false,
    myProgress: myParticipation
      ? {
          score: 0, // computed below
          goal: getDayCount(c as Challenge),
          pct: 0,
          rank: myParticipation.rank,
          completed: myParticipation.completed,
          totalValue: myParticipation.totalValue,
          goalTarget: c.goalTarget,
          goalUnit: c.goalUnit,
          streak: 0, // computed below
          achievedMilestones: (myParticipation.achievedMilestones as string[]) || [],
          dayEntries: (c.dayEntries || []).map((de) => ({
            id: de.id,
            dayNumber: de.dayNumber,
            completed: de.completed,
            mediaUrls: de.mediaUrls,
            value: de.value,
          })),
        }
      : null,
    isActive: c.isActive,
    createdAt: c.createdAt,
  };
}

const challengeIncludes = {
  _count: { select: { participants: true } },
  group: { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true, username: true, avatar: true } },
  dayEntries: false as const,
};

export const challengeService = {
  async browse(
    userId: string | undefined,
    type?: ChallengeType,
    category?: ChallengeCategory,
    difficulty?: ChallengeDifficulty,
    cursor?: string,
    limit = 20,
    groupId?: string,
  ) {
    const where: Record<string, unknown> = { isActive: true };
    if (type) where.type = type;
    if (category) where.category = category;
    if (difficulty) where.difficulty = difficulty;
    if (groupId) where.groupId = groupId;

    // GROUP challenges only visible to group members
    if (!groupId) {
      const userGroups = userId
        ? (await prisma.groupMember.findMany({
            where: { userId },
            select: { groupId: true },
          })).map((g) => g.groupId)
        : [];
      where.OR = [
        { type: { not: "GROUP" } },
        { type: "GROUP", groupId: { in: userGroups } },
      ];
    }

    const challenges = await prisma.challenge.findMany({
      where,
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      include: {
        ...challengeIncludes,
        participants: userId ? { where: { userId }, take: 1 } : false,
        savedBy: userId ? { where: { userId }, take: 1, select: { userId: true } } : false,
      },
      orderBy: { createdAt: "desc" },
    });

    const hasMore = challenges.length > limit;
    const items = hasMore ? challenges.slice(0, limit) : challenges;

    const formatted = await Promise.all(
      items.map(async (c) => {
        const myParticipation = Array.isArray(c.participants) ? c.participants[0] : null;
        const savedByArr = Array.isArray(c.savedBy) ? c.savedBy : [];
        const f = formatChallenge({ ...c, savedBy: savedByArr }, myParticipation, userId);
        if (myParticipation && f.myProgress) {
          f.myProgress.score = await computeScore(c.id, myParticipation.userId);
          f.myProgress.pct = Math.min((f.myProgress.score / f.myProgress.goal) * 100, 100);
          const streak = await computeStreak(c.id, myParticipation.userId);
          f.myProgress.streak = streak;
        }
        return f;
      }),
    );

    return {
      challenges: formatted,
      nextCursor: hasMore ? items[items.length - 1]?.id : null,
      hasMore,
    };
  },

  async search(userId: string | undefined, query: string, cursor?: string, limit = 20) {
    const challenges = await prisma.challenge.findMany({
      where: {
        isActive: true,
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
      },
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      include: {
        ...challengeIncludes,
        participants: userId ? { where: { userId }, take: 1 } : false,
        savedBy: userId ? { where: { userId }, take: 1, select: { userId: true } } : false,
      },
      orderBy: { createdAt: "desc" },
    });

    const hasMore = challenges.length > limit;
    const items = hasMore ? challenges.slice(0, limit) : challenges;

    const formatted = await Promise.all(
      items.map(async (c) => {
        const myParticipation = Array.isArray(c.participants) ? c.participants[0] : null;
        const f = formatChallenge(c, myParticipation, userId);
        if (myParticipation && f.myProgress) {
          f.myProgress.score = await computeScore(c.id, myParticipation.userId);
          f.myProgress.pct = Math.min((f.myProgress.score / f.myProgress.goal) * 100, 100);
          f.myProgress.streak = await computeStreak(c.id, myParticipation.userId);
        }
        return f;
      }),
    );

    return {
      challenges: formatted,
      nextCursor: hasMore ? items[items.length - 1]?.id : null,
      hasMore,
    };
  },

  async getById(challengeId: string, userId?: string) {
    const challenge = await prisma.challenge.findUniqueOrThrow({
      where: { id: challengeId },
      include: {
        ...challengeIncludes,
        participants: userId ? { where: { userId }, take: 1 } : false,
        savedBy: userId ? { where: { userId }, take: 1, select: { userId: true } } : false,
        dayEntries: userId
          ? {
              where: { userId },
              orderBy: { dayNumber: "asc" },
              select: { id: true, dayNumber: true, completed: true, mediaUrls: true, value: true },
            }
          : false,
      },
    });

    // GROUP challenges only visible to group members
    if (challenge.type === "GROUP" && challenge.groupId && userId) {
      const membership = await prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId: challenge.groupId, userId } },
      });
      if (!membership && challenge.createdById !== userId) {
        throw new AppError(403, "Only group members can view this challenge");
      }
    }

    const myParticipation = Array.isArray(challenge.participants)
      ? challenge.participants[0]
      : null;
    const f = formatChallenge(
      { ...challenge, dayEntries: Array.isArray(challenge.dayEntries) ? challenge.dayEntries : [] },
      myParticipation,
      userId,
    );
    if (myParticipation && f.myProgress) {
      f.myProgress.score = await computeScore(challengeId, myParticipation.userId);
      f.myProgress.pct = Math.min((f.myProgress.score / f.myProgress.goal) * 100, 100);
      f.myProgress.streak = await computeStreak(challengeId, myParticipation.userId);
    }
    return f;
  },

  async getSaved(userId: string) {
    const saved = await prisma.savedChallenge.findMany({
      where: { userId },
      include: {
        challenge: {
          include: {
            ...challengeIncludes,
            participants: { where: { userId }, take: 1 },
            savedBy: { where: { userId }, take: 1, select: { userId: true } },
          },
        },
      },
      orderBy: { savedAt: "desc" },
    });

    const formatted = await Promise.all(
      saved.map(async (s) => {
        const myParticipation = Array.isArray(s.challenge.participants)
          ? s.challenge.participants[0]
          : null;
        const f = formatChallenge(s.challenge, myParticipation, userId);
        if (myParticipation && f.myProgress) {
          f.myProgress.score = await computeScore(s.challenge.id, myParticipation.userId);
          f.myProgress.pct = Math.min((f.myProgress.score / f.myProgress.goal) * 100, 100);
          f.myProgress.streak = await computeStreak(s.challenge.id, myParticipation.userId);
        }
        return f;
      }),
    );

    return formatted;
  },

  async create(data: {
    title: string;
    description: string;
    type: ChallengeType;
    groupId?: string;
    startDate: string;
    endDate: string;
    entryFee?: number;
    prize?: string;
    goalTarget?: number;
    goalUnit?: string;
    category?: ChallengeCategory;
    difficulty?: ChallengeDifficulty;
    dayCount?: number;
    milestones?: Record<string, unknown>[];
    templateId?: string;
    createdById: string;
  }) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    const calculatedDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000));
    const dayCount = data.dayCount ?? calculatedDays;

    const challenge = await prisma.challenge.create({
      data: {
        title: data.title,
        description: data.description,
        type: data.type,
        groupId: data.groupId,
        startDate: start,
        endDate: end,
        entryFee: data.entryFee,
        prize: data.prize,
        goalTarget: data.goalTarget,
        goalUnit: data.goalUnit,
        category: data.category,
        difficulty: data.difficulty,
        dayCount,
        milestones: data.milestones ? (data.milestones as Prisma.InputJsonValue) : undefined,
        templateId: data.templateId,
        createdById: data.createdById,
      },
    });

    if (data.templateId) {
      await prisma.challengeTemplate.update({
        where: { id: data.templateId },
        data: { timesUsed: { increment: 1 } },
      });
    }

    return challenge;
  },

  async update(
    challengeId: string,
    userId: string,
    data: {
      title?: string;
      description?: string;
      type?: ChallengeType;
      groupId?: string | null;
      startDate?: string;
      endDate?: string;
      entryFee?: number | null;
      prize?: string | null;
      goalTarget?: number | null;
      goalUnit?: string | null;
      category?: ChallengeCategory;
      difficulty?: ChallengeDifficulty;
      dayCount?: number;
      milestones?: Record<string, unknown>[];
    },
  ) {
    const challenge = await prisma.challenge.findUniqueOrThrow({ where: { id: challengeId } });
    if (challenge.createdById !== userId)
      throw new AppError(403, "Only the creator can edit this challenge");

    const startDate = data.startDate !== undefined ? new Date(data.startDate) : undefined;
    const endDate = data.endDate !== undefined ? new Date(data.endDate) : undefined;

    let dayCount = data.dayCount;
    if (dayCount === undefined && (startDate || endDate)) {
      const s = startDate || challenge.startDate;
      const e = endDate || challenge.endDate;
      if (s && e) {
        dayCount = Math.max(1, Math.round((e.getTime() - s.getTime()) / 86400000));
      }
    }

    return prisma.challenge.update({
      where: { id: challengeId },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.type !== undefined ? { type: data.type } : {}),
        ...(data.groupId !== undefined ? { groupId: data.groupId } : {}),
        ...(startDate !== undefined ? { startDate } : {}),
        ...(endDate !== undefined ? { endDate } : {}),
        ...(data.entryFee !== undefined ? { entryFee: data.entryFee } : {}),
        ...(data.prize !== undefined ? { prize: data.prize } : {}),
        ...(data.goalTarget !== undefined ? { goalTarget: data.goalTarget } : {}),
        ...(data.goalUnit !== undefined ? { goalUnit: data.goalUnit } : {}),
        ...(data.category !== undefined ? { category: data.category } : {}),
        ...(data.difficulty !== undefined ? { difficulty: data.difficulty } : {}),
        ...(dayCount !== undefined ? { dayCount } : {}),
        ...(data.milestones !== undefined
          ? { milestones: data.milestones as Prisma.InputJsonValue }
          : {}),
      },
    });
  },

  async join(challengeId: string, userId: string) {
    const existing = await prisma.challengeParticipant.findUnique({
      where: { challengeId_userId: { challengeId, userId } },
    });
    if (existing) throw new AppError(409, "Already joined this challenge");

    const challenge = await prisma.challenge.findUniqueOrThrow({
      where: { id: challengeId },
      select: {
        type: true, createdById: true, title: true, dayCount: true,
        groupId: true, startDate: true, endDate: true,
      },
    });

    const now = new Date();
    if (challenge.startDate && now < challenge.startDate) {
      throw new AppError(400, "This challenge hasn't started yet");
    }
    if (challenge.endDate && now > challenge.endDate) {
      throw new AppError(400, "This challenge has already ended");
    }

    if (challenge.type === "GROUP" && challenge.groupId) {
      const membership = await prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId: challenge.groupId, userId } },
      });
      if (!membership) {
        throw new AppError(403, "You must join the group first to participate in this challenge");
      }
    }

    if (challenge.type === "DUEL") {
      const participantCount = await prisma.challengeParticipant.count({ where: { challengeId } });
      if (participantCount >= 2) throw new AppError(400, "Duel is full (max 2 participants)");
    }

    const participation = await prisma.challengeParticipant.create({
      data: { challengeId, userId },
    });

    await createActivity({
      challengeId,
      userId,
      type: "JOIN",
      message: `joined the challenge`,
    });

    if (challenge.createdById !== userId) {
      await notificationService.create({
        type: "CHALLENGE_INVITE",
        userId: challenge.createdById,
        fromUserId: userId,
        message: `joined your challenge "${challenge.title}"`,
      });
    }

    await broadcastRealtime(challengeId, "PARTICIPANT_JOINED", { userId });

    return participation;
  },

  async leave(challengeId: string, userId: string) {
    const existing = await prisma.challengeParticipant.findUnique({
      where: { challengeId_userId: { challengeId, userId } },
    });
    if (!existing) throw new AppError(403, "Not a participant");

    await prisma.challengeParticipant.delete({
      where: { challengeId_userId: { challengeId, userId } },
    });
  },

  async remove(challengeId: string, userId: string) {
    const challenge = await prisma.challenge.findUniqueOrThrow({ where: { id: challengeId } });
    if (challenge.createdById !== userId)
      throw new AppError(403, "Only the creator can delete this challenge");

    await prisma.challenge.delete({ where: { id: challengeId } });
  },

  async checkIn(
    challengeId: string,
    userId: string,
    data: {
      dayNumber: number;
      completed: boolean;
      notes?: string;
      mediaUrls?: string[];
      sharedToFeed?: boolean;
      value?: number;
    },
  ) {
    const participant = await prisma.challengeParticipant.findUniqueOrThrow({
      where: { challengeId_userId: { challengeId, userId } },
      include: {
        challenge: {
          select: {
            id: true,
            title: true,
            createdById: true,
            dayCount: true,
            milestones: true,
            goalTarget: true,
            goalUnit: true,
            startDate: true,
            endDate: true,
          },
        },
      },
    });

    const now = new Date();
    const { startDate, endDate } = participant.challenge;
    if (startDate && now < startDate) {
      throw new AppError(400, "This challenge hasn't started yet");
    }
    if (endDate && now > endDate) {
      throw new AppError(400, "This challenge has already ended");
    }

    const dayCount = participant.challenge.dayCount || DEFAULT_DAY_COUNT;
    if (data.dayNumber < 1 || data.dayNumber > dayCount) {
      throw new AppError(400, `Day number must be between 1 and ${dayCount}`);
    }

    // Prevent checking in for future days beyond today's elapsed day
    const todayDay = Math.max(1, Math.floor((now.getTime() - new Date(startDate).getTime()) / 86400000) + 1);
    if (data.dayNumber > todayDay) {
      throw new AppError(400, `Cannot check in for day ${data.dayNumber} yet (today is day ${todayDay})`);
    }

    const existingEntry = await prisma.challengeDayEntry.findUnique({
      where: {
        challengeId_userId_dayNumber: {
          challengeId,
          userId,
          dayNumber: data.dayNumber,
        },
      },
    });
    if (existingEntry?.completed) {
      throw new AppError(409, "Already checked in for this day");
    }

    const entry = await prisma.challengeDayEntry.upsert({
      where: {
        challengeId_userId_dayNumber: {
          challengeId,
          userId,
          dayNumber: data.dayNumber,
        },
      },
      update: {
        completed: data.completed,
        notes: data.notes,
        mediaUrls: data.mediaUrls || [],
        sharedToFeed: data.sharedToFeed ?? false,
        value: data.value,
        completedAt: data.completed ? new Date() : null,
      },
      create: {
        challengeId,
        userId,
        dayNumber: data.dayNumber,
        completed: data.completed,
        notes: data.notes,
        mediaUrls: data.mediaUrls || [],
        sharedToFeed: data.sharedToFeed ?? false,
        value: data.value,
        completedAt: data.completed ? new Date() : null,
      },
    });

    const totalScore = await computeScore(challengeId, userId);
    const goal = dayCount;
    const isComplete = totalScore >= goal;

    const allDayEntries = await prisma.challengeDayEntry.findMany({
      where: { challengeId, userId, completed: true },
      select: { value: true },
    });
    const totalValue = allDayEntries.reduce((sum, e) => sum + (e.value ?? 0), 0);

    const currentAchieved = (participant.achievedMilestones as string[]) || [];
    const newMilestones = await checkMilestones(challengeId, userId, currentAchieved);
    const allAchieved = [...currentAchieved, ...newMilestones];

    if (newMilestones.length > 0 || (isComplete && !participant.completed)) {
      await prisma.challengeParticipant.update({
        where: { challengeId_userId: { challengeId, userId } },
        data: {
          score: totalScore,
          totalValue,
          ...(newMilestones.length > 0
            ? { achievedMilestones: allAchieved as Prisma.InputJsonValue }
            : {}),
          ...(isComplete && !participant.completed
            ? { completed: true, completedAt: new Date() }
            : {}),
        },
      });
    } else {
      await prisma.challengeParticipant.update({
        where: { challengeId_userId: { challengeId, userId } },
        data: { score: totalScore, totalValue },
      });
    }

    await createActivity({
      challengeId,
      userId,
      type: "CHECK_IN",
      message: `checked in on day ${data.dayNumber}`,
      metadata: { dayNumber: data.dayNumber, completed: data.completed, mediaUrls: data.mediaUrls },
    });

    if (participant.challenge.createdById !== userId) {
      await notificationService.create({
        type: "SYSTEM",
        userId: participant.challenge.createdById,
        fromUserId: userId,
        message: `checked in on "${participant.challenge.title}" (day ${data.dayNumber})`,
      });
    }

    for (const m of newMilestones) {
      await createActivity({
        challengeId,
        userId,
        type: "MILESTONE",
        message: `reached the "${m}" milestone!`,
        metadata: { milestoneName: m },
      });
      await notificationService.create({
        type: "STREAK_MILESTONE",
        userId,
        message: `You reached the "${m}" milestone in "${participant.challenge.title}"!`,
      });
    }

    if (isComplete && !participant.completed) {
      await createActivity({
        challengeId,
        userId,
        type: "COMPLETE",
        message: `completed the challenge!`,
      });
      try {
        await postService.create({
          content: `I completed the "${participant.challenge.title}" challenge! 🎉`,
          userId,
          privacy: "PUBLIC",
        });
      } catch {}
    }

    if (data.sharedToFeed && data.completed) {
      try {
        await postService.create({
          content: `Day ${data.dayNumber}/${dayCount} of "${participant.challenge.title}" 💪`,
          mediaUrls: data.mediaUrls || [],
          userId,
          privacy: "PUBLIC",
        });
      } catch {}
    }

    await broadcastRealtime(challengeId, "CHECK_IN", {
      userId,
      dayNumber: data.dayNumber,
      score: totalScore,
    });

    return entry;
  },

  async getCalendar(challengeId: string, userId: string) {
    const challenge = await prisma.challenge.findUniqueOrThrow({
      where: { id: challengeId },
      select: { dayCount: true },
    });
    const dayCount = challenge.dayCount || DEFAULT_DAY_COUNT;

    const entries = await prisma.challengeDayEntry.findMany({
      where: { challengeId, userId },
      orderBy: { dayNumber: "asc" },
      select: {
        dayNumber: true,
        completed: true,
        mediaUrls: true,
        notes: true,
        completedAt: true,
        value: true,
      },
    });

    const dayMap = new Map(entries.map((e) => [e.dayNumber, e]));

    const days = Array.from({ length: dayCount }, (_, i) => {
      const day = i + 1;
      const entry = dayMap.get(day);
      return {
        dayNumber: day,
        completed: entry?.completed ?? false,
        mediaUrls: entry?.mediaUrls || [],
        notes: entry?.notes || null,
        completedAt: entry?.completedAt || null,
        value: entry?.value || null,
      };
    });

    return { days, dayCount };
  },

  async getBeforeAfter(challengeId: string, userId: string) {
    const entries = await prisma.challengeDayEntry.findMany({
      where: { challengeId, userId, completed: true, mediaUrls: { isEmpty: false } },
      orderBy: { dayNumber: "asc" },
      select: { dayNumber: true, mediaUrls: true, completedAt: true },
    });

    const firstPhoto = entries.find((e) => e.mediaUrls.length > 0);
    const lastPhoto = entries.length > 0 ? entries[entries.length - 1] : null;

    const totalDays = await prisma.challengeDayEntry.count({
      where: { challengeId, userId, completed: true },
    });

    const totalPossible = await prisma.challenge.findUniqueOrThrow({
      where: { id: challengeId },
      select: { dayCount: true },
    });

    const streak = await computeStreak(challengeId, userId);

    return {
      before: firstPhoto?.mediaUrls[0] || null,
      after: lastPhoto?.mediaUrls[0] || null,
      firstDay: firstPhoto?.dayNumber || null,
      lastDay: lastPhoto?.dayNumber || null,
      stats: {
        totalDays: totalDays,
        completionRate: totalPossible.dayCount
          ? Math.round((totalDays / totalPossible.dayCount) * 100)
          : 0,
        bestStreak: streak,
      },
    };
  },

  async getActivityFeed(challengeId: string, cursor?: string, limit = 20) {
    const activities = await prisma.challengeActivity.findMany({
      where: { challengeId },
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      include: {
        user: { select: { id: true, name: true, username: true, avatar: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const hasMore = activities.length > limit;
    const items = hasMore ? activities.slice(0, limit) : activities;

    return {
      activities: items,
      nextCursor: hasMore ? items[items.length - 1]?.id : null,
      hasMore,
    };
  },

  async getLeaderboard(challengeId: string, limit = 50) {
    const participants = await prisma.challengeParticipant.findMany({
      where: { challengeId },
      orderBy: [
        { completed: "desc" },
        { completedAt: { sort: "asc", nulls: "last" } },
        { totalValue: "desc" },
        { score: "desc" },
        { joinedAt: "asc" },
      ],
      take: limit,
      include: {
        user: { select: { id: true, name: true, username: true, avatar: true } },
      },
    });

    const leaderboard = await Promise.all(
      participants.map(async (p, i) => ({
        userId: p.userId,
        user: p.user,
        score: p.score,
        totalValue: p.totalValue,
        rank: i + 1,
        completed: p.completed,
        completedAt: p.completedAt?.toISOString() ?? null,
        streak: await computeStreak(challengeId, p.userId),
      })),
    );

    return leaderboard;
  },

  async getMyChallenges(userId: string) {
    const participations = await prisma.challengeParticipant.findMany({
      where: { userId },
      include: {
        challenge: {
          include: {
            _count: { select: { participants: true } },
            group: { select: { id: true, name: true } },
            createdBy: { select: { id: true, name: true, username: true, avatar: true } },
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });

    const formatted = await Promise.all(
      participations.map(async (p) => {
        const c = p.challenge;
        const score = await computeScore(c.id, userId);
        const streak = await computeStreak(c.id, userId);
        const goal = getDayCount(c);
        return {
          ...c,
          difficulty: c.difficulty || "BEGINNER",
          dayCount: c.dayCount || DEFAULT_DAY_COUNT,
          category: c.category || "GENERAL",
          milestones: c.milestones as { name: string; threshold: number; icon: string }[] | null,
          participantCount: c._count.participants,
          myProgress: {
            score,
            goal,
            pct: Math.min((score / goal) * 100, 100),
            rank: p.rank,
            completed: p.completed,
            streak,
            achievedMilestones: (p.achievedMilestones as string[]) || [],
            dayEntries: [],
          },
          isJoined: true,
        };
      }),
    );

    return formatted;
  },

  async toggleSave(challengeId: string, userId: string) {
    const existing = await prisma.savedChallenge.findUnique({
      where: { userId_challengeId: { userId, challengeId } },
    });

    if (existing) {
      await prisma.savedChallenge.delete({
        where: { userId_challengeId: { userId, challengeId } },
      });
      return { saved: false };
    }

    await prisma.savedChallenge.create({ data: { userId, challengeId } });
    return { saved: true };
  },

  async share(challengeId: string, userId: string, content?: string) {
    const challenge = await prisma.challenge.findUniqueOrThrow({
      where: { id: challengeId },
      select: { title: true },
    });

    return postService.create({
      content: content || `I'm joining the "${challenge.title}" challenge! 🏆`,
      userId,
      privacy: "PUBLIC",
    });
  },

  async getComments(challengeId: string, cursor?: string, limit = 20) {
    const comments = await prisma.challengeComment.findMany({
      where: { challengeId, parentId: null },
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      include: {
        user: { select: { id: true, name: true, username: true, avatar: true } },
        reactions: {
          select: { id: true, type: true, userId: true, createdAt: true },
        },
        replies: {
          take: 3,
          orderBy: { createdAt: "asc" },
          include: {
            user: { select: { id: true, name: true, username: true, avatar: true } },
            reactions: {
              select: { id: true, type: true, userId: true, createdAt: true },
            },
          },
        },
        _count: { select: { replies: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const hasMore = comments.length > limit;
    const items = hasMore ? comments.slice(0, limit) : comments;

    return { comments: items, nextCursor: hasMore ? items[items.length - 1]?.id : null, hasMore };
  },

  async addComment(challengeId: string, userId: string, content: string, parentId?: string) {
    const comment = await prisma.challengeComment.create({
      data: { challengeId, userId, content, parentId },
      include: {
        user: { select: { id: true, name: true, username: true, avatar: true } },
        reactions: {
          select: { id: true, type: true, userId: true, createdAt: true },
        },
        _count: { select: { replies: true } },
      },
    });

    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      select: { createdById: true, title: true },
    });

    if (challenge && challenge.createdById !== userId) {
      notificationService
        .create({
          type: "POST_COMMENT",
          userId: challenge.createdById,
          fromUserId: userId,
          message: `commented on your challenge "${challenge.title}"`,
        })
        .catch(() => {});
    }

    await createActivity({
      challengeId,
      userId,
      type: "COMMENT",
      message: `commented on the challenge`,
    });

    await broadcastRealtime(challengeId, "NEW_COMMENT", { userId, commentId: comment.id });

    return comment;
  },

  async deleteComment(commentId: string, userId: string) {
    const comment = await prisma.challengeComment.findUniqueOrThrow({ where: { id: commentId } });
    if (comment.userId !== userId) throw new AppError(403, "Not your comment");

    await prisma.challengeComment.delete({ where: { id: commentId } });
  },

  async reactToComment(commentId: string, userId: string, type: string) {
    const existing = await prisma.challengeCommentReaction.findUnique({
      where: { commentId_userId_type: { commentId, userId, type: type as $Enums.ReactionType } },
    });

    if (existing) {
      await prisma.challengeCommentReaction.delete({ where: { id: existing.id } });
      return { reacted: false };
    }

    await prisma.challengeCommentReaction.create({
      data: { commentId, userId, type: type as $Enums.ReactionType },
    });
    return { reacted: true };
  },

  async removeReaction(commentId: string, userId: string, type: string) {
    const existing = await prisma.challengeCommentReaction.findUnique({
      where: { commentId_userId_type: { commentId, userId, type: type as $Enums.ReactionType } },
    });
    if (!existing) return { reacted: false };

    await prisma.challengeCommentReaction.delete({ where: { id: existing.id } });
    return { reacted: false };
  },

  async invite(challengeId: string, fromUserId: string, toUserId: string) {
    const challenge = await prisma.challenge.findUniqueOrThrow({
      where: { id: challengeId },
      select: { title: true, type: true },
    });

    if (challenge.type === "SOLO") throw new AppError(400, "Cannot invite to a solo challenge");

    const existing = await prisma.challengeInvite.findUnique({
      where: { challengeId_toUserId: { challengeId, toUserId } },
    });
    if (existing) throw new AppError(409, "Already invited");

    await prisma.challengeInvite.create({
      data: { challengeId, fromUserId, toUserId },
    });

    await notificationService.create({
      type: "CHALLENGE_INVITE",
      userId: toUserId,
      fromUserId,
      message: `invited you to "${challenge.title}"`,
    });
  },

  async respondToInvite(inviteId: string, userId: string, accept: boolean) {
    const invite = await prisma.challengeInvite.findUniqueOrThrow({ where: { id: inviteId } });
    if (invite.toUserId !== userId) throw new AppError(403, "Not your invite");
    if (invite.status !== "PENDING") throw new AppError(409, "Already responded");

    if (accept) {
      await prisma.$transaction([
        prisma.challengeInvite.update({ where: { id: inviteId }, data: { status: "ACCEPTED" } }),
        prisma.challengeParticipant.create({ data: { challengeId: invite.challengeId, userId } }),
      ]);
    } else {
      await prisma.challengeInvite.update({
        where: { id: inviteId },
        data: { status: "DECLINED" },
      });
    }
  },

  async getMyInvites(userId: string) {
    return prisma.challengeInvite.findMany({
      where: { toUserId: userId, status: "PENDING" },
      include: {
        challenge: { select: { id: true, title: true, type: true, category: true } },
        fromUser: { select: { id: true, name: true, username: true, avatar: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async getUserStats(userId: string) {
    const [totalJoined, totalCompleted, totalCheckIns, challengesByCategory, recentCompletions] =
      await Promise.all([
        prisma.challengeParticipant.count({ where: { userId } }),
        prisma.challengeParticipant.count({ where: { userId, completed: true } }),
        prisma.challengeDayEntry.count({ where: { userId, completed: true } }),

        prisma.challengeParticipant.findMany({
          where: { userId },
          include: { challenge: { select: { category: true } } },
        }),

        prisma.challengeParticipant.findMany({
          where: { userId, completed: true },
          include: {
            challenge: { select: { id: true, title: true, category: true } },
          },
          orderBy: { joinedAt: "desc" },
          take: 5,
        }),
      ]);

    const categoryCount: Record<string, number> = {};
    for (const p of challengesByCategory) {
      const cat = p.challenge.category || "GENERAL";
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    }

    const sortedParticipations = await prisma.challengeParticipant.findMany({
      where: { userId },
      select: { challengeId: true },
    });

    const streaks = await Promise.all(
      sortedParticipations.map((p) => computeStreak(p.challengeId, userId)),
    );
    const bestStreak = Math.max(0, ...streaks);

    return {
      totalJoined,
      totalCompleted,
      completionRate: totalJoined > 0 ? Math.round((totalCompleted / totalJoined) * 100) : 0,
      totalCheckIns,
      bestStreak,
      challengesByCategory: categoryCount,
      recentCompletions: recentCompletions.map((p) => ({
        id: p.challenge.id,
        title: p.challenge.title,
        category: p.challenge.category || "GENERAL",
      })),
    };
  },

  async createDuel(data: {
    title: string;
    description?: string;
    targetUserId: string;
    startDate: string;
    endDate: string;
    goalTarget?: number;
    goalUnit?: string;
    category?: ChallengeCategory;
    dayCount?: number;
    createdById: string;
  }) {
    if (data.targetUserId === data.createdById) {
      throw new AppError(400, "Cannot duel yourself");
    }

    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    const calculatedDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000));

    const challenge = await prisma.challenge.create({
      data: {
        title: data.title,
        description: data.description || `Duel: ${data.title}`,
        type: "DUEL",
        startDate: start,
        endDate: end,
        goalTarget: data.goalTarget,
        goalUnit: data.goalUnit,
        category: data.category,
        difficulty: "INTERMEDIATE",
        dayCount: data.dayCount ?? calculatedDays,
        createdById: data.createdById,
      },
    });

    await prisma.challengeParticipant.createMany({
      data: [
        { challengeId: challenge.id, userId: data.createdById },
        { challengeId: challenge.id, userId: data.targetUserId },
      ],
    });

    await createActivity({
      challengeId: challenge.id,
      userId: data.createdById,
      type: "JOIN",
      message: `started a duel!`,
    });
    await createActivity({
      challengeId: challenge.id,
      userId: data.targetUserId,
      type: "JOIN",
      message: `joined the duel!`,
    });

    await notificationService.create({
      type: "CHALLENGE_INVITE",
      userId: data.targetUserId,
      fromUserId: data.createdById,
      message: `challenged you to a duel: "${challenge.title}"`,
    });

    return challenge;
  },

  async getDuel(challengeId: string) {
    const challenge = await prisma.challenge.findUniqueOrThrow({
      where: { id: challengeId },
      include: {
        _count: { select: { participants: true } },
        participants: {
          include: {
            user: { select: { id: true, name: true, username: true, avatar: true } },
          },
        },
        createdBy: { select: { id: true, name: true, username: true, avatar: true } },
      },
    });

    if (challenge.type !== "DUEL") throw new AppError(400, "Not a duel challenge");

    const participantsWithStats = await Promise.all(
      challenge.participants.map(async (p) => ({
        userId: p.userId,
        user: p.user,
        score: await computeScore(challengeId, p.userId),
        streak: await computeStreak(challengeId, p.userId),
        completed: p.completed,
        joinedAt: p.joinedAt,
      })),
    );

    // Winner is the one with higher score (or first to reach it)
    const sorted = [...participantsWithStats].sort(
      (a, b) => b.score - a.score || a.joinedAt.getTime() - b.joinedAt.getTime(),
    );
    const winner = sorted[0]?.userId !== sorted[1]?.userId ? sorted[0] : null;

    return {
      id: challenge.id,
      title: challenge.title,
      description: challenge.description,
      type: challenge.type,
      category: challenge.category,
      difficulty: challenge.difficulty,
      dayCount: challenge.dayCount,
      startDate: challenge.startDate,
      endDate: challenge.endDate,
      createdBy: challenge.createdBy,
      participants: participantsWithStats,
      winner: winner ? { userId: winner.userId, user: winner.user } : null,
      isActive: challenge.isActive,
      createdAt: challenge.createdAt,
    };
  },
};
