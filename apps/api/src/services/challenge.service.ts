import { prisma } from "../lib/prisma";
import { AppError } from "../utils/AppError";
import { broadcastRealtime } from "../utils/realtime";
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
    notes?: string | null;
    mediaUrls: string[];
    value?: number | null;
    sharedToFeed: boolean;
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

async function batchComputeProgress(
  pairs: { challengeId: string; userId: string }[],
): Promise<Map<string, { score: number; streak: number; totalValue: number }>> {
  if (pairs.length === 0) return new Map();

  const allEntries = await prisma.challengeDayEntry.findMany({
    where: {
      OR: pairs.map((p) => ({
        challengeId: p.challengeId,
        userId: p.userId,
        completed: true,
      })),
    },
    select: { challengeId: true, userId: true, dayNumber: true, value: true },
    orderBy: { dayNumber: "desc" },
  });

  const grouped = new Map<string, { dayNumbers: number[]; totalValue: number }>();
  for (const e of allEntries) {
    const key = `${e.challengeId}:${e.userId}`;
    if (!grouped.has(key)) grouped.set(key, { dayNumbers: [], totalValue: 0 });
    const g = grouped.get(key)!;
    g.dayNumbers.push(e.dayNumber);
    g.totalValue += e.value ?? 0;
  }

  const result = new Map<string, { score: number; streak: number; totalValue: number }>();
  for (const pair of pairs) {
    const key = `${pair.challengeId}:${pair.userId}`;
    const g = grouped.get(key);
    const dayNumbers = g?.dayNumbers || [];
    const totalValue = g?.totalValue ?? 0;
    const score = dayNumbers.length;

    let streak = 0;
    if (dayNumbers.length > 0) {
      streak = 1;
      for (let i = 1; i < dayNumbers.length; i++) {
        if (dayNumbers[i] === dayNumbers[i - 1] - 1) {
          streak++;
        } else {
          break;
        }
      }
    }

    result.set(key, { score, streak, totalValue });
  }

  return result;
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
  currentScore?: number,
): Promise<string[]> {
  const challenge = await prisma.challenge.findUniqueOrThrow({
    where: { id: challengeId },
    select: { milestones: true },
  });
  const milestones =
    (challenge.milestones as { name: string; threshold: number; icon: string }[]) || [];
  const score = currentScore ?? (await computeScore(challengeId, userId));
  const newlyAchieved: string[] = [];
  for (const m of milestones) {
    if (score >= m.threshold && !previousAchieved.includes(m.name)) {
      newlyAchieved.push(m.name);
    }
  }
  return newlyAchieved;
}

async function getFriendCounts(
  challengeIds: string[],
  userId: string,
): Promise<Map<string, number>> {
  if (challengeIds.length === 0) return new Map();
  const follows = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });
  const followingIds = follows.map((f) => f.followingId);
  if (followingIds.length === 0) return new Map();

  const participants = await prisma.challengeParticipant.findMany({
    where: {
      challengeId: { in: challengeIds },
      userId: { in: followingIds },
    },
    select: { challengeId: true },
  });

  const counts = new Map<string, number>();
  for (const p of participants) {
    counts.set(p.challengeId, (counts.get(p.challengeId) ?? 0) + 1);
  }
  return counts;
}

async function getCompletedCounts(challengeIds: string[]): Promise<Map<string, number>> {
  if (challengeIds.length === 0) return new Map();
  const results = await prisma.challengeParticipant.groupBy({
    by: ["challengeId"],
    where: { challengeId: { in: challengeIds }, completed: true },
    _count: { challengeId: true },
  });
  const map = new Map<string, number>();
  for (const r of results) {
    map.set(r.challengeId, r._count.challengeId);
  }
  return map;
}

async function getRatingAggregates(
  challengeIds: string[],
): Promise<Map<string, { averageRating: number; ratingCount: number }>> {
  if (challengeIds.length === 0) return new Map();
  try {
    const results = await prisma.challengeRating.groupBy({
      by: ["challengeId"],
      where: { challengeId: { in: challengeIds } },
      _avg: { rating: true },
      _count: { challengeId: true },
    });
    const map = new Map<string, { averageRating: number; ratingCount: number }>();
    for (const r of results) {
      map.set(r.challengeId, {
        averageRating: Math.round((r._avg.rating ?? 0) * 10) / 10,
        ratingCount: r._count.challengeId,
      });
    }
    return map;
  } catch {
    return new Map();
  }
}

function formatChallenge(
  c: ChallengeWithRelations,
  myParticipation: ChallengeParticipant | null,
  userId?: string,
  extra?: {
    friendCount?: number;
    totalCompleted?: number;
    isFull?: boolean;
    requiredGroup?: { id: string; name: string } | null;
    averageRating?: number;
    ratingCount?: number;
  },
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
    isFull: extra?.isFull ?? (c.type === "DUEL" ? (c._count?.participants ?? 0) >= 2 : false),
    requiredGroup: extra?.requiredGroup ?? null,
    friendCount: extra?.friendCount ?? 0,
    totalCompleted: extra?.totalCompleted ?? 0,
    averageRating: extra?.averageRating ?? 0,
    ratingCount: extra?.ratingCount ?? 0,
    myProgress: myParticipation
      ? {
          score: 0,
          goal: getDayCount(c as Challenge),
          pct: 0,
          rank: myParticipation.rank,
          completed: myParticipation.completed,
          totalValue: myParticipation.totalValue,
          goalTarget: c.goalTarget,
          goalUnit: c.goalUnit,
          streak: 0,
          currentDayNumber: myParticipation.currentDayNumber,
          achievedMilestones: (myParticipation.achievedMilestones as string[]) || [],
          dayEntries: (c.dayEntries || []).map((de) => ({
            id: de.id,
            dayNumber: de.dayNumber,
            completed: de.completed,
            notes: de.notes,
            mediaUrls: de.mediaUrls,
            value: de.value,
            sharedToFeed: de.sharedToFeed,
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
        ? (
            await prisma.groupMember.findMany({
              where: { userId },
              select: { groupId: true },
            })
          ).map((g) => g.groupId)
        : [];
      where.OR = [{ type: { not: "GROUP" } }, { type: "GROUP", groupId: { in: userGroups } }];
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

    const formatted = items.map((c) => {
      const myParticipation = Array.isArray(c.participants) ? c.participants[0] : null;
      const savedByArr = Array.isArray(c.savedBy) ? c.savedBy : [];
      return formatChallenge({ ...c, savedBy: savedByArr }, myParticipation, userId);
    });

    const joinedPairs = items
      .map((c) => {
        const p = Array.isArray(c.participants) ? c.participants[0] : null;
        return p ? { challengeId: c.id, userId: p.userId } : null;
      })
      .filter((x): x is { challengeId: string; userId: string } => x !== null);

    const progressMap = await batchComputeProgress(joinedPairs);

    // Social proof: fetch friend counts and completion counts
    const challengeIds = items.map((c) => c.id);
    const [friendCounts, completedCounts, ratingData] = await Promise.all([
      userId
        ? getFriendCounts(challengeIds, userId)
        : Promise.resolve<Map<string, number>>(new Map()),
      getCompletedCounts(challengeIds),
      getRatingAggregates(challengeIds),
    ]);

    for (const f of formatted) {
      const progress = progressMap.get(`${f.id}:${userId}`);
      if (progress && f.myProgress) {
        f.myProgress.score = progress.score;
        f.myProgress.pct = Math.min((progress.score / f.myProgress.goal) * 100, 100);
        f.myProgress.streak = progress.streak;
        f.myProgress.totalValue = progress.totalValue;
      }
      f.friendCount = friendCounts.get(f.id) ?? 0;
      f.totalCompleted = completedCounts.get(f.id) ?? 0;
      const r = ratingData.get(f.id);
      if (r) {
        f.averageRating = r.averageRating;
        f.ratingCount = r.ratingCount;
      }
    }

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

    const formatted = items.map((c) => {
      const myParticipation = Array.isArray(c.participants) ? c.participants[0] : null;
      return formatChallenge(c, myParticipation, userId);
    });

    const joinedPairs = items
      .map((c) => {
        const p = Array.isArray(c.participants) ? c.participants[0] : null;
        return p ? { challengeId: c.id, userId: p.userId } : null;
      })
      .filter((x): x is { challengeId: string; userId: string } => x !== null);

    const progressMap = await batchComputeProgress(joinedPairs);

    const challengeIds = items.map((c) => c.id);
    const [friendCounts, completedCounts, ratingData] = await Promise.all([
      userId
        ? getFriendCounts(challengeIds, userId)
        : Promise.resolve<Map<string, number>>(new Map()),
      getCompletedCounts(challengeIds),
      getRatingAggregates(challengeIds),
    ]);

    for (const f of formatted) {
      const progress = progressMap.get(`${f.id}:${userId}`);
      if (progress && f.myProgress) {
        f.myProgress.score = progress.score;
        f.myProgress.pct = Math.min((progress.score / f.myProgress.goal) * 100, 100);
        f.myProgress.streak = progress.streak;
        f.myProgress.totalValue = progress.totalValue;
      }
      f.friendCount = friendCounts.get(f.id) ?? 0;
      f.totalCompleted = completedCounts.get(f.id) ?? 0;
      const r = ratingData.get(f.id);
      if (r) {
        f.averageRating = r.averageRating;
        f.ratingCount = r.ratingCount;
      }
    }

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
              select: { id: true, dayNumber: true, completed: true, notes: true, mediaUrls: true, value: true, sharedToFeed: true },
            }
          : false,
      },
    });

    // GROUP challenges: non-members can view but see "join group" message
    if (challenge.type === "GROUP" && challenge.groupId && userId) {
      const membership = await prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId: challenge.groupId, userId } },
      });
      if (!membership && challenge.createdById !== userId && challenge.group) {
        // Store on the plain challenge object for use below
        (challenge as Record<string, unknown>).__requiredGroup = {
          id: challenge.group.id,
          name: challenge.group.name,
        };
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
      const progress = await batchComputeProgress([
        { challengeId, userId: myParticipation.userId },
      ]);
      const p = progress.get(`${challengeId}:${myParticipation.userId}`);
      if (p) {
        f.myProgress.score = p.score;
        f.myProgress.pct = Math.min((p.score / f.myProgress.goal) * 100, 100);
        f.myProgress.streak = p.streak;
      }
    }

    // Social proof for single challenge view
    if (userId) {
      const [friendCounts, completedCounts, ratingData] = await Promise.all([
        getFriendCounts([challengeId], userId),
        getCompletedCounts([challengeId]),
        getRatingAggregates([challengeId]),
      ]);
      f.friendCount = friendCounts.get(challengeId) ?? 0;
      f.totalCompleted = completedCounts.get(challengeId) ?? 0;
      const r = ratingData.get(challengeId);
      if (r) {
        f.averageRating = r.averageRating;
        f.ratingCount = r.ratingCount;
      }
    }

    // Group challenge: set requiredGroup for non-members from earlier check
    const reqGroup = (challenge as Record<string, unknown>).__requiredGroup as
      | { id: string; name: string }
      | undefined;
    if (reqGroup) {
      f.requiredGroup = reqGroup;
    }

    return f;
  },

  async getSaved(userId: string, cursor?: string, limit = 50) {
    const saved = await prisma.savedChallenge.findMany({
      where: { userId },
      take: limit + 1,
      ...(cursor
        ? { skip: 1, cursor: { userId_challengeId: { userId, challengeId: cursor } } }
        : {}),
      include: {
        challenge: {
          include: {
            ...challengeIncludes,
            participants: { where: { userId }, take: 1 },
            savedBy: { where: { userId }, take: 1, select: { userId: true } },
          },
        },
      },
      orderBy: [{ savedAt: "desc" }, { challengeId: "desc" }],
    });

    const hasMore = saved.length > limit;
    const items = hasMore ? saved.slice(0, limit) : saved;

    const formatted = items.map((s) => {
      const myParticipation = Array.isArray(s.challenge.participants)
        ? s.challenge.participants[0]
        : null;
      return formatChallenge(s.challenge, myParticipation, userId);
    });

    const joinedPairs = items
      .map((s) => {
        const p = Array.isArray(s.challenge.participants) ? s.challenge.participants[0] : null;
        return p ? { challengeId: s.challenge.id, userId: p.userId } : null;
      })
      .filter((x): x is { challengeId: string; userId: string } => x !== null);

    const progressMap = await batchComputeProgress(joinedPairs);

    const challengeIds = items.map((s) => s.challenge.id);
    const [friendCounts, completedCounts, ratingData] = await Promise.all([
      getFriendCounts(challengeIds, userId),
      getCompletedCounts(challengeIds),
      getRatingAggregates(challengeIds),
    ]);

    for (const f of formatted) {
      const progress = progressMap.get(`${f.id}:${userId}`);
      if (progress && f.myProgress) {
        f.myProgress.score = progress.score;
        f.myProgress.pct = Math.min((progress.score / f.myProgress.goal) * 100, 100);
        f.myProgress.streak = progress.streak;
        f.myProgress.totalValue = progress.totalValue;
      }
      f.friendCount = friendCounts.get(f.id) ?? 0;
      f.totalCompleted = completedCounts.get(f.id) ?? 0;
      const r = ratingData.get(f.id);
      if (r) {
        f.averageRating = r.averageRating;
        f.ratingCount = r.ratingCount;
      }
    }

    return {
      data: formatted,
      nextCursor: hasMore ? (items[items.length - 1]?.challengeId ?? null) : null,
      hasMore,
    };
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
    dayPlans?: {
      dayNumber: number;
      title?: string;
      description?: string;
      tips?: string;
      duration?: number;
    }[];
    createdById: string;
  }) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    const calculatedDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000));
    const dayCount = data.dayCount ?? calculatedDays;

    const challenge = await prisma.$transaction(async (tx) => {
      const c = await tx.challenge.create({
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

      if (data.dayPlans?.length) {
        await tx.challengeDayPlan.createMany({
          data: data.dayPlans.map((dp) => ({
            challengeId: c.id,
            dayNumber: dp.dayNumber,
            title: dp.title ?? `Day ${dp.dayNumber}`,
            description: dp.description ?? null,
            tips: dp.tips ?? null,
            mediaUrls: [],
            duration: dp.duration ?? null,
          })),
        });
      } else {
        // Auto-create default day plans for every challenge
        const plans = Array.from({ length: dayCount }, (_, i) => ({
          challengeId: c.id,
          dayNumber: i + 1,
          title: `Day ${i + 1}`,
          description: null,
          tips: null,
          mediaUrls: [] as string[],
          duration: null,
        }));
        await tx.challengeDayPlan.createMany({ data: plans });
      }

      if (data.templateId) {
        await tx.challengeTemplate.update({
          where: { id: data.templateId },
          data: { timesUsed: { increment: 1 } },
        });
      }

      return c;
    });

    broadcastRealtime(`hb-challenge:${challenge.id}`, "CHALLENGE_CREATED", {
      challengeId: challenge.id,
    }).catch(() => {});

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

    const updated = await prisma.challenge.update({
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

    broadcastRealtime(`hb-challenge:${challengeId}`, "CHALLENGE_UPDATED", {
      challengeId,
    }).catch(() => {});

    return updated;
  },

  async join(challengeId: string, userId: string) {
    const existing = await prisma.challengeParticipant.findUnique({
      where: { challengeId_userId: { challengeId, userId } },
    });
    if (existing) return existing;

    const challenge = await prisma.challenge.findUniqueOrThrow({
      where: { id: challengeId },
      select: {
        type: true,
        createdById: true,
        title: true,
        dayCount: true,
        groupId: true,
        startDate: true,
        endDate: true,
      },
    });

    const now = new Date();
    if (challenge.startDate && now < challenge.startDate) {
      throw new AppError(400, "This challenge hasn't started yet");
    }
    if (challenge.endDate) {
      const endOfDay = new Date(challenge.endDate);
      endOfDay.setHours(23, 59, 59, 999);
      if (now > endOfDay) throw new AppError(400, "This challenge has already ended");
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

    const participation = await prisma.$transaction(async (tx) => {
      const p = await tx.challengeParticipant.create({
        data: { challengeId, userId },
      });

      await tx.challengeActivity.create({
        data: {
          challengeId,
          userId,
          type: "JOIN",
          message: `joined the challenge`,
        },
      });

      return p;
    });

    if (challenge.createdById !== userId) {
      await notificationService.create({
        type: "CHALLENGE_INVITE",
        userId: challenge.createdById,
        fromUserId: userId,
        message: `joined your challenge "${challenge.title}"`,
      });
    }

    await broadcastRealtime(`hb-challenge:${challengeId}`, "PARTICIPANT_JOINED", { userId });

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

    await broadcastRealtime(`hb-challenge:${challengeId}`, "PARTICIPANT_LEFT", { userId });
  },

  async remove(challengeId: string, userId: string) {
    const challenge = await prisma.challenge.findUniqueOrThrow({ where: { id: challengeId } });
    if (challenge.createdById !== userId)
      throw new AppError(403, "Only the creator can delete this challenge");

    await prisma.challenge.delete({ where: { id: challengeId } });
    await broadcastRealtime(`hb-challenge:${challengeId}`, "CHALLENGE_DELETED", { challengeId });
  },

  async checkIn(
    challengeId: string,
    userId: string,
    data: {
      dayNumber?: number;
      skip?: boolean;
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

    if (participant.completed) {
      throw new AppError(409, "You already completed this challenge");
    }

    const now = new Date();
    const { startDate, endDate } = participant.challenge;
    if (startDate && now < startDate) {
      throw new AppError(400, "This challenge hasn't started yet");
    }
    if (endDate) {
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      if (now > endOfDay) throw new AppError(400, "This challenge has already ended");
    }

    const dayCount = participant.challenge.dayCount || DEFAULT_DAY_COUNT;
    const totalPlans = await prisma.challengeDayPlan.count({ where: { challengeId } });
    const hasDayPlans = totalPlans > 0;
    const maxDay = hasDayPlans ? totalPlans : dayCount;

    // Determine which day to check in for
    const targetDay = data.dayNumber ?? participant.currentDayNumber;

    // Validate day range
    if (targetDay < 1 || targetDay > maxDay) {
      throw new AppError(400, `Day must be between 1 and ${maxDay}`);
    }
    if (targetDay > participant.currentDayNumber) {
      throw new AppError(
        400,
        `Cannot check in for day ${targetDay} yet (current day is ${participant.currentDayNumber})`,
      );
    }

    // Prevent checking in before today's actual calendar day
    const todayCal = Math.max(
      1,
      Math.floor((now.getTime() - new Date(startDate).getTime()) / 86400000) + 1,
    );
    if (targetDay > todayCal) {
      throw new AppError(
        400,
        `Cannot check in for day ${targetDay} yet (today is calendar day ${todayCal})`,
      );
    }

    const isBackfill = targetDay < participant.currentDayNumber;

    if (data.skip) {
      if (isBackfill) {
        throw new AppError(400, "Cannot skip a past day");
      }
      const nextDay = targetDay + 1;
      const isComplete = nextDay > maxDay;

      await prisma.$transaction(async (tx) => {
        await tx.challengeParticipant.update({
          where: { challengeId_userId: { challengeId, userId } },
          data: {
            currentDayNumber: nextDay,
            ...(isComplete ? { completed: true, completedAt: new Date() } : {}),
          },
        });

        await tx.challengeActivity.create({
          data: {
            challengeId,
            userId,
            type: "CHECK_IN",
            message: `skipped day ${targetDay}`,
            metadata: { dayNumber: targetDay, completed: false } as Prisma.InputJsonValue,
          },
        });

        if (isComplete) {
          await tx.challengeActivity.create({
            data: {
              challengeId,
              userId,
              type: "COMPLETE",
              message: `completed the challenge!`,
            },
          });
        }
      });

      if (isComplete) {
        try {
          await postService.create({
            content: `I completed the "${participant.challenge.title}" challenge! 🎉`,
            userId,
            privacy: "PUBLIC",
          });
        } catch {}
      }

      await broadcastRealtime(`hb-challenge:${challengeId}`, "CHECK_IN", {
        userId,
        dayNumber: targetDay,
        score: participant.score,
      });
      return null;
    }

    const existingEntry = await prisma.challengeDayEntry.findUnique({
      where: {
        challengeId_userId_dayNumber: { challengeId, userId, dayNumber: targetDay },
      },
    });
    if (existingEntry?.completed && !isBackfill) {
      const updated = await prisma.challengeDayEntry.update({
        where: {
          challengeId_userId_dayNumber: { challengeId, userId, dayNumber: targetDay },
        },
        data: {
          notes: data.notes,
          mediaUrls: data.mediaUrls || [],
          sharedToFeed: data.sharedToFeed ?? false,
          value: data.value,
        },
      });
      await broadcastRealtime(`hb-challenge:${challengeId}`, "CHECK_IN", {
        userId,
        dayNumber: targetDay,
        score: participant.score,
      });
      return updated;
    }

    // Consolidate queries: fetch completed entries once instead of 3 separate calls
    const allCompletedEntries = await prisma.challengeDayEntry.findMany({
      where: { challengeId, userId, completed: true },
      select: { value: true },
    });
    const score = allCompletedEntries.length;
    const totalValue = allCompletedEntries.reduce((sum, e) => sum + (e.value ?? 0), 0);

    const currentAchieved = (participant.achievedMilestones as string[]) || [];
    const newMilestones = await checkMilestones(challengeId, userId, currentAchieved, score + 1);
    const allAchieved = [...currentAchieved, ...newMilestones];

    const nextDay = isBackfill ? 0 : targetDay + 1;

    const [entry] = await prisma.$transaction(async (tx) => {
      const e = await tx.challengeDayEntry.upsert({
        where: {
          challengeId_userId_dayNumber: { challengeId, userId, dayNumber: targetDay },
        },
        update: {
          completed: true,
          notes: data.notes,
          mediaUrls: data.mediaUrls || [],
          sharedToFeed: data.sharedToFeed ?? false,
          value: data.value,
          completedAt: new Date(),
        },
        create: {
          challengeId,
          userId,
          dayNumber: targetDay,
          completed: true,
          notes: data.notes,
          mediaUrls: data.mediaUrls || [],
          sharedToFeed: data.sharedToFeed ?? false,
          value: data.value,
          completedAt: new Date(),
        },
      });

      if (isBackfill) {
        await tx.challengeParticipant.update({
          where: { challengeId_userId: { challengeId, userId } },
          data: {
            score,
            totalValue,
            ...(newMilestones.length > 0
              ? { achievedMilestones: allAchieved as Prisma.InputJsonValue }
              : {}),
          },
        });
      } else {
        const isComplete = nextDay > maxDay;
        await tx.challengeParticipant.update({
          where: { challengeId_userId: { challengeId, userId } },
          data: {
            score,
            totalValue,
            currentDayNumber: nextDay,
            ...(newMilestones.length > 0
              ? { achievedMilestones: allAchieved as Prisma.InputJsonValue }
              : {}),
            ...(isComplete ? { completed: true, completedAt: new Date() } : {}),
          },
        });
      }

      await tx.challengeActivity.create({
        data: {
          challengeId,
          userId,
          type: "CHECK_IN",
          message: isBackfill ? `backfilled day ${targetDay}` : `checked in on day ${targetDay}`,
          metadata: {
            dayNumber: targetDay,
            completed: true,
            mediaUrls: data.mediaUrls ?? [],
          } as Prisma.InputJsonValue,
        },
      });

      for (const m of newMilestones) {
        await tx.challengeActivity.create({
          data: {
            challengeId,
            userId,
            type: "MILESTONE",
            message: `reached the "${m}" milestone!`,
            metadata: { milestoneName: m } as Prisma.InputJsonValue,
          },
        });
      }

      return [e];
    });

    if (participant.challenge.createdById !== userId) {
      await notificationService.create({
        type: "SYSTEM",
        userId: participant.challenge.createdById,
        fromUserId: userId,
        message: `${isBackfill ? "backfilled" : "checked in on"} "${participant.challenge.title}" (day ${targetDay})`,
      });
    }

    for (const m of newMilestones) {
      await notificationService.create({
        type: "STREAK_MILESTONE",
        userId,
        message: `You reached the "${m}" milestone in "${participant.challenge.title}"!`,
      });
    }

    if (!isBackfill) {
      if (nextDay > maxDay) {
        try {
          await postService.create({
            content: `I completed the "${participant.challenge.title}" challenge! 🎉`,
            userId,
            privacy: "PUBLIC",
          });
        } catch {}
      }
      if (data.sharedToFeed) {
        try {
          await postService.create({
            content: `Day ${targetDay}/${maxDay} of "${participant.challenge.title}" 💪`,
            mediaUrls: data.mediaUrls || [],
            userId,
            privacy: "PUBLIC",
          });
        } catch {}
      }
    }

    await broadcastRealtime(`hb-challenge:${challengeId}`, "CHECK_IN", {
      userId,
      dayNumber: targetDay,
      score,
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
    const [entries, participant] = await Promise.all([
      prisma.challengeDayEntry.findMany({
        where: { challengeId, userId, completed: true, mediaUrls: { isEmpty: false } },
        orderBy: { dayNumber: "asc" },
        select: { dayNumber: true, mediaUrls: true, completedAt: true },
      }),
      prisma.challengeParticipant.findUnique({
        where: { challengeId_userId: { challengeId, userId } },
        select: { beforePhoto: true, afterPhoto: true },
      }),
    ]);

    const firstPhoto = entries.find((e) => e.mediaUrls.length > 0);
    const lastPhoto = entries.length > 0 ? entries[entries.length - 1] : null;

    const before = participant?.beforePhoto || null;
    const after = participant?.afterPhoto || null;

    const totalDays = await prisma.challengeDayEntry.count({
      where: { challengeId, userId, completed: true },
    });

    const totalPossible = await prisma.challenge.findUniqueOrThrow({
      where: { id: challengeId },
      select: { dayCount: true },
    });

    const streak = await computeStreak(challengeId, userId);

    return {
      before,
      after,
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

  async uploadBeforePhoto(challengeId: string, userId: string, photoUrl: string) {
    if (!photoUrl) throw new AppError(400, "Photo URL is required");
    const participant = await prisma.challengeParticipant.findUnique({
      where: { challengeId_userId: { challengeId, userId } },
    });
    if (!participant) throw new AppError(404, "Not a participant");

    const result = await prisma.challengeParticipant.update({
      where: { challengeId_userId: { challengeId, userId } },
      data: { beforePhoto: photoUrl },
      select: { beforePhoto: true },
    });

    broadcastRealtime(`hb-challenge:${challengeId}`, "BEFORE_PHOTO_UPLOADED", {
      challengeId,
      userId,
    }).catch(() => {});

    return result;
  },

  async uploadAfterPhoto(challengeId: string, userId: string, photoUrl: string) {
    if (!photoUrl) throw new AppError(400, "Photo URL is required");
    const participant = await prisma.challengeParticipant.findUnique({
      where: { challengeId_userId: { challengeId, userId } },
    });
    if (!participant) throw new AppError(404, "Not a participant");

    const result = await prisma.challengeParticipant.update({
      where: { challengeId_userId: { challengeId, userId } },
      data: { afterPhoto: photoUrl },
      select: { afterPhoto: true },
    });

    broadcastRealtime(`hb-challenge:${challengeId}`, "AFTER_PHOTO_UPLOADED", {
      challengeId,
      userId,
    }).catch(() => {});

    return result;
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

    const streakPairs = participants.map((p) => ({ challengeId, userId: p.userId }));
    const progressMap = await batchComputeProgress(streakPairs);

    const leaderboard = participants.map((p, i) => ({
      userId: p.userId,
      user: p.user,
      score: p.score,
      totalValue: p.totalValue,
      rank: i + 1,
      completed: p.completed,
      completedAt: p.completedAt?.toISOString() ?? null,
      streak: progressMap.get(`${challengeId}:${p.userId}`)?.streak ?? 0,
    }));

    return leaderboard;
  },

  async upsertDayPlans(
    challengeId: string,
    userId: string,
    plans: {
      dayNumber: number;
      title?: string;
      description?: string;
      tips?: string;
      mediaUrls?: string[];
      duration?: number;
    }[],
  ) {
    const challenge = await prisma.challenge.findUniqueOrThrow({
      where: { id: challengeId },
      select: { createdById: true, dayCount: true },
    });
    if (challenge.createdById !== userId)
      throw new AppError(403, "Only the creator can set day plans");

    for (const plan of plans) {
      if (plan.dayNumber < 1 || plan.dayNumber > (challenge.dayCount || DEFAULT_DAY_COUNT)) {
        throw new AppError(400, `Day ${plan.dayNumber} is out of range`);
      }
    }

    const operations = plans.map((plan) =>
      prisma.challengeDayPlan.upsert({
        where: { challengeId_dayNumber: { challengeId, dayNumber: plan.dayNumber } },
        update: {
          title: plan.title,
          description: plan.description,
          tips: plan.tips,
          mediaUrls: plan.mediaUrls || [],
          duration: plan.duration,
        },
        create: {
          challengeId,
          dayNumber: plan.dayNumber,
          title: plan.title,
          description: plan.description,
          tips: plan.tips,
          mediaUrls: plan.mediaUrls || [],
          duration: plan.duration,
        },
      }),
    );

    return prisma.$transaction(operations);
  },

  async getDayPlans(challengeId: string) {
    return prisma.challengeDayPlan.findMany({
      where: { challengeId },
      orderBy: { dayNumber: "asc" },
      take: 366,
    });
  },

  async getDayPlan(challengeId: string, dayNumber: number) {
    const plan = await prisma.challengeDayPlan.findUnique({
      where: { challengeId_dayNumber: { challengeId, dayNumber } },
    });
    return plan || null;
  },

  async rate(challengeId: string, userId: string, rating: number, review?: string) {
    if (rating < 1 || rating > 5) throw new AppError(400, "Rating must be between 1 and 5");

    const participant = await prisma.challengeParticipant.findUnique({
      where: { challengeId_userId: { challengeId, userId } },
    });
    if (!participant) throw new AppError(403, "You must join the challenge to rate it");

    const existing = await prisma.challengeRating.findUnique({
      where: { challengeId_userId: { challengeId, userId } },
    });

    let result;
    if (existing) {
      result = await prisma.challengeRating.update({
        where: { challengeId_userId: { challengeId, userId } },
        data: { rating, review },
      });
    } else {
      result = await prisma.challengeRating.create({
        data: { challengeId, userId, rating, review },
      });
    }

    broadcastRealtime(`hb-challenge:${challengeId}`, "CHALLENGE_RATED", {
      challengeId,
      userId,
      rating,
    }).catch(() => {});

    return result;
  },

  async getRatings(challengeId: string, _userId?: string) {
    const ratings = await prisma.challengeRating.findMany({
      where: { challengeId },
      include: {
        user: { select: { id: true, name: true, username: true, avatar: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const aggregate = await prisma.challengeRating.aggregate({
      where: { challengeId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    return {
      ratings,
      averageRating: Math.round((aggregate._avg.rating ?? 0) * 10) / 10,
      ratingCount: aggregate._count.rating,
    };
  },

  async getMyChallenges(userId: string, cursor?: string, limit = 100) {
    const participations = await prisma.challengeParticipant.findMany({
      where: { userId },
      take: limit + 1,
      ...(cursor
        ? { skip: 1, cursor: { challengeId_userId: { challengeId: cursor, userId } } }
        : {}),
      include: {
        challenge: {
          include: {
            _count: { select: { participants: true } },
            group: { select: { id: true, name: true } },
            createdBy: { select: { id: true, name: true, username: true, avatar: true } },
          },
        },
      },
      orderBy: [{ joinedAt: "desc" }, { challengeId: "desc" }],
    });

    const hasMore = participations.length > limit;
    const items = hasMore ? participations.slice(0, limit) : participations;

    const progressPairs = items.map((p) => ({
      challengeId: p.challenge.id,
      userId,
    }));
    const progressMap = await batchComputeProgress(progressPairs);

    const challengeIds = items.map((p) => p.challenge.id);
    const [friendCounts, completedCounts, ratingData] = await Promise.all([
      getFriendCounts(challengeIds, userId),
      getCompletedCounts(challengeIds),
      getRatingAggregates(challengeIds),
    ]);

    const formatted = items.map((p) => {
      const c = p.challenge;
      const progress = progressMap.get(`${c.id}:${userId}`);
      const score = progress?.score ?? 0;
      const streak = progress?.streak ?? 0;
      const goal = getDayCount(c);
      return {
        ...c,
        difficulty: c.difficulty || "BEGINNER",
        dayCount: c.dayCount || DEFAULT_DAY_COUNT,
        category: c.category || "GENERAL",
        milestones: c.milestones as { name: string; threshold: number; icon: string }[] | null,
        participantCount: c._count.participants,
        isFull: c.type === "DUEL" ? (c._count?.participants ?? 0) >= 2 : false,
        friendCount: friendCounts.get(c.id) ?? 0,
        totalCompleted: completedCounts.get(c.id) ?? 0,
        averageRating: ratingData.get(c.id)?.averageRating ?? 0,
        ratingCount: ratingData.get(c.id)?.ratingCount ?? 0,
        myProgress: {
          score,
          goal,
          pct: Math.min((score / goal) * 100, 100),
          rank: p.rank,
          completed: p.completed,
          totalValue: p.totalValue,
          goalTarget: c.goalTarget,
          goalUnit: c.goalUnit,
          streak,
          currentDayNumber: p.currentDayNumber,
          achievedMilestones: (p.achievedMilestones as string[]) || [],
          dayEntries: [],
        },
        isJoined: true,
      };
    });

    return {
      data: formatted,
      nextCursor: hasMore ? (items[items.length - 1]?.challengeId ?? null) : null,
      hasMore,
    };
  },

  async toggleSave(challengeId: string, userId: string) {
    const existing = await prisma.savedChallenge.findUnique({
      where: { userId_challengeId: { userId, challengeId } },
    });

    let saved: boolean;
    if (existing) {
      await prisma.savedChallenge.delete({
        where: { userId_challengeId: { userId, challengeId } },
      });
      saved = false;
    } else {
      await prisma.savedChallenge.create({ data: { userId, challengeId } });
      saved = true;
    }

    broadcastRealtime(`hb-challenge:${challengeId}`, saved ? "CHALLENGE_SAVED" : "CHALLENGE_UNSAVED", {
      challengeId,
      userId,
    }).catch(() => {});

    return { saved };
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

    await broadcastRealtime(`hb-challenge:${challengeId}`, "NEW_COMMENT", {
      userId,
      commentId: comment.id,
    });

    return comment;
  },

  async deleteComment(commentId: string, userId: string) {
    const comment = await prisma.challengeComment.findUniqueOrThrow({ where: { id: commentId } });
    if (comment.userId !== userId) throw new AppError(403, "Not your comment");

    const challengeId = comment.challengeId;
    await prisma.challengeComment.delete({ where: { id: commentId } });
    await broadcastRealtime(`hb-challenge:${challengeId}`, "COMMENT_DELETED", {
      commentId,
      userId,
    });
  },

  async reactToComment(commentId: string, userId: string, type: string) {
    const existing = await prisma.challengeCommentReaction.findUnique({
      where: { commentId_userId_type: { commentId, userId, type: type as $Enums.ReactionType } },
    });

    if (existing) {
      await prisma.challengeCommentReaction.delete({ where: { id: existing.id } });
      const comment = await prisma.challengeComment.findUniqueOrThrow({
        where: { id: commentId },
        select: { challengeId: true },
      });
      await broadcastRealtime(`hb-challenge:${comment.challengeId}`, "COMMENT_REACTION", {
        commentId,
        userId,
        type,
        reacted: false,
      });
      return { reacted: false };
    }

    await prisma.challengeCommentReaction.create({
      data: { commentId, userId, type: type as $Enums.ReactionType },
    });
    const comment = await prisma.challengeComment.findUniqueOrThrow({
      where: { id: commentId },
      select: { challengeId: true },
    });
    await broadcastRealtime(`hb-challenge:${comment.challengeId}`, "COMMENT_REACTION", {
      commentId,
      userId,
      type,
      reacted: true,
    });
    return { reacted: true };
  },

  async removeReaction(commentId: string, userId: string, type: string) {
    const existing = await prisma.challengeCommentReaction.findUnique({
      where: { commentId_userId_type: { commentId, userId, type: type as $Enums.ReactionType } },
    });
    if (!existing) return { reacted: false };

    const comment = await prisma.challengeComment.findUnique({
      where: { id: commentId },
      select: { challengeId: true },
    });

    await prisma.challengeCommentReaction.delete({ where: { id: existing.id } });

    broadcastRealtime(`hb-challenge:${comment?.challengeId}`, "CHALLENGE_REACTION_REMOVED", {
      commentId,
      userId,
    }).catch(() => {});

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

    const invite = await prisma.$transaction(async (tx) => {
      const inv = await tx.challengeInvite.create({
        data: { challengeId, fromUserId, toUserId },
        include: {
          challenge: { select: { id: true, title: true, type: true, category: true } },
          fromUser: { select: { id: true, name: true, username: true, avatar: true } },
        },
      });
      return inv;
    });

    await notificationService.create({
      type: "CHALLENGE_INVITE",
      userId: toUserId,
      fromUserId,
      message: `invited you to "${challenge.title}"`,
    });

    broadcastRealtime(`hb-challenge:${challengeId}`, "CHALLENGE_INVITE", {
      inviteId: invite.id,
      challengeId,
      fromUserId,
      toUserId,
    }).catch(() => {});

    return invite;
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

      broadcastRealtime(`hb-challenge:${invite.challengeId}`, "PARTICIPANT_JOINED", {
        challengeId: invite.challengeId,
        userId,
      }).catch(() => {});
    } else {
      await prisma.challengeInvite.update({
        where: { id: inviteId },
        data: { status: "DECLINED" },
      });

      broadcastRealtime(`hb-challenge:${invite.challengeId}`, "INVITE_DECLINED", {
        inviteId,
        challengeId: invite.challengeId,
      }).catch(() => {});
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
      take: 100,
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

    const allParticipations = await prisma.challengeParticipant.findMany({
      where: { userId },
      select: { challengeId: true },
    });

    const streakPairs = allParticipations.map((p) => ({
      challengeId: p.challengeId,
      userId,
    }));
    const progressMap = await batchComputeProgress(streakPairs);
    let bestStreak = 0;
    for (const p of allParticipations) {
      const s = progressMap.get(`${p.challengeId}:${userId}`)?.streak ?? 0;
      if (s > bestStreak) bestStreak = s;
    }

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

    const challenge = await prisma.$transaction(async (tx) => {
      const c = await tx.challenge.create({
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

      await tx.challengeParticipant.createMany({
        data: [
          { challengeId: c.id, userId: data.createdById },
          { challengeId: c.id, userId: data.targetUserId },
        ],
      });

      await tx.challengeActivity.createMany({
        data: [
          { challengeId: c.id, userId: data.createdById, type: "JOIN", message: "started a duel!" },
          {
            challengeId: c.id,
            userId: data.targetUserId,
            type: "JOIN",
            message: "joined the duel!",
          },
        ],
      });

      return c;
    });

    await notificationService.create({
      type: "CHALLENGE_INVITE",
      userId: data.targetUserId,
      fromUserId: data.createdById,
      message: `challenged you to a duel: "${challenge.title}"`,
    });

    broadcastRealtime(`hb-challenge:${challenge.id}`, "CHALLENGE_CREATED", {
      challengeId: challenge.id,
    }).catch(() => {});

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

    const duelPairs = challenge.participants.map((p) => ({
      challengeId,
      userId: p.userId,
    }));
    const progressMap = await batchComputeProgress(duelPairs);

    const participantsWithStats = challenge.participants.map((p) => {
      const progress = progressMap.get(`${challengeId}:${p.userId}`);
      return {
        userId: p.userId,
        user: p.user,
        score: progress?.score ?? 0,
        streak: progress?.streak ?? 0,
        completed: p.completed,
        joinedAt: p.joinedAt,
      };
    });

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
