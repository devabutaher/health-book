import { prisma } from "../lib/prisma";
import { AppError } from "../utils/AppError";
import { broadcastRealtime } from "../utils/realtime";
import type { HealthLogType, Prisma } from "../../generated/prisma";

const calculateScore = (type: HealthLogType, data: Record<string, unknown>): number => {
  switch (type) {
    case "ROUTINE": {
      let score = 0;
      if (data.wakeTime && data.sleepTime) score += 30;
      if (data.meals && Array.isArray(data.meals))
        score += Math.min((data.meals as unknown[]).length * 10, 30);
      if (typeof data.waterIntake === "number") score += Math.min(data.waterIntake * 3, 20);
      if (typeof data.screenTime === "number" && data.screenTime <= 8) score += 20;
      return score;
    }
    case "GOAL": {
      if (typeof data.completionRate === "number") return data.completionRate;
      const items = data.items as { completed: boolean }[] | undefined;
      if (!items || items.length === 0) return 0;
      return Math.round((items.filter((i) => i.completed).length / items.length) * 100);
    }
    case "WORKOUT": {
      let score = 0;
      if (data.duration && typeof data.duration === "number") score += Math.min(data.duration, 60);
      if (data.intensity && typeof data.intensity === "number") score += data.intensity * 4;
      if (data.exercises && Array.isArray(data.exercises))
        score += Math.min((data.exercises as unknown[]).length * 5, 20);
      return Math.min(score, 100);
    }
    case "MOOD": {
      let score = 50;
      if (data.mood && typeof data.mood === "number") score += (data.mood - 3) * 15;
      if (data.gratitude && Array.isArray(data.gratitude))
        score += Math.min((data.gratitude as unknown[]).length * 5, 15);
      if (data.reflection && typeof data.reflection === "string" && data.reflection.length > 0)
        score += 10;
      if (data.stressLevel && typeof data.stressLevel === "number")
        score += Math.max(0, (10 - data.stressLevel) * 3);
      return Math.max(0, Math.min(score, 100));
    }
    case "QUICK": {
      const kind = data.type as string;
      if (kind === "water") return Math.min((data.glasses as number) || 0, 8) * 12;
      if (kind === "sleep") {
        let score = 0;
        const hours = data.sleepHours as number;
        const quality = data.sleepQuality as number;
        if (hours && hours >= 6) score += 50;
        if (quality) score += quality * 10;
        return Math.min(score, 100);
      }
      return 50;
    }
  }
};

export const healthLogService = {
  async create(
    userId: string,
    type: HealthLogType,
    date: string,
    data: Record<string, unknown>,
    isPublic: boolean,
  ) {
    const score = calculateScore(type, data);

    const log = await prisma.healthLog.create({
      data: {
        userId,
        type,
        date: new Date(date),
        data: data as Prisma.InputJsonValue,
        score,
        isPublic,
      },
    });

    broadcastRealtime(`hb-health:${userId}`, "HEALTH_LOG_CREATED", {
      logId: log.id,
      userId,
      type,
    }).catch(() => {});

    return log;
  },

  async list(userId: string, params: { type?: HealthLogType; limit?: number; cursor?: string }) {
    const where: Prisma.HealthLogWhereInput = { userId };
    if (params.type) where.type = params.type;

    const limit = (params.limit || 20) + 1;
    const logs = await prisma.healthLog.findMany({
      where,
      orderBy: { date: "desc" },
      take: limit,
      ...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
    });

    const hasMore = logs.length === limit;
    if (hasMore) logs.pop();
    return { logs, nextCursor: hasMore ? logs[logs.length - 1]?.id : null, hasMore };
  },

  async getById(userId: string, id: string) {
    const log = await prisma.healthLog.findFirst({ where: { id, userId } });
    if (!log) throw new AppError(404, "Health log not found");
    return log;
  },

  async update(
    userId: string,
    id: string,
    data: {
      type?: HealthLogType;
      date?: string;
      data?: Record<string, unknown>;
      isPublic?: boolean;
    },
  ) {
    const existing = await prisma.healthLog.findFirst({ where: { id, userId } });
    if (!existing) throw new AppError(404, "Health log not found");

    const updateData: Record<string, unknown> = {};
    if (data.type) updateData.type = data.type;
    if (data.date) updateData.date = new Date(data.date);
    if (data.data) updateData.data = data.data as Prisma.InputJsonValue;
    if (data.isPublic !== undefined) updateData.isPublic = data.isPublic;

    if (data.data || data.type) {
      updateData.score = calculateScore(
        data.type || existing.type,
        data.data || (existing.data as Record<string, unknown>),
      );
    }

    const updated = await prisma.healthLog.update({ where: { id }, data: updateData });

    broadcastRealtime(`hb-health:${userId}`, "HEALTH_LOG_UPDATED", {
      logId: id,
      userId,
    }).catch(() => {});

    return updated;
  },

  async remove(userId: string, id: string) {
    const existing = await prisma.healthLog.findFirst({ where: { id, userId } });
    if (!existing) throw new AppError(404, "Health log not found");

    await prisma.healthLog.delete({ where: { id } });

    broadcastRealtime(`hb-health:${userId}`, "HEALTH_LOG_DELETED", {
      logId: id,
      userId,
    }).catch(() => {});
  },

  async copyToMyBook(userId: string, logId: string) {
    const original = await prisma.healthLog.findUnique({ where: { id: logId } });
    if (!original) throw new AppError(404, "Health log not found");
    if (!original.isPublic) throw new AppError(403, "Cannot copy a private health log");

    return prisma.healthLog.create({
      data: {
        userId,
        type: original.type,
        date: new Date(),
        data: original.data as Prisma.InputJsonValue,
        score: original.score,
        isPublic: false,
      },
    });
  },

  async share(userId: string, logId: string, content: string) {
    const log = await prisma.healthLog.findFirst({ where: { id: logId, userId } });
    if (!log) throw new AppError(404, "Health log not found");

    return prisma.post.create({
      data: {
        content,
        userId,
        templateType: log.type,
        healthLogId: log.id,
        mediaUrls: [],
        privacy: "PUBLIC",
      },
    });
  },

  async getStats(userId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const logs = await prisma.healthLog.findMany({
      where: { userId, date: { gte: thirtyDaysAgo } },
      orderBy: { date: "desc" },
    });

    const totalLogs = logs.length;
    const avgScore =
      totalLogs > 0 ? Math.round(logs.reduce((sum, l) => sum + (l.score || 0), 0) / totalLogs) : 0;

    const logDates = new Set(logs.map((l) => l.date.toISOString().split("T")[0]));
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      if (logDates.has(key)) {
        streak++;
      } else {
        break;
      }
    }

    const byType = await prisma.healthLog.groupBy({
      by: ["type"],
      where: { userId, date: { gte: thirtyDaysAgo } },
      _count: { id: true },
      _avg: { score: true },
    });

    return {
      streak,
      totalLogs,
      avgScore,
      healthScore: avgScore,
      byType: byType.map((t) => ({
        type: t.type,
        count: t._count.id,
        avgScore: Math.round(t._avg.score || 0),
      })),
    };
  },

  async getTrends(userId: string, days: number = 90) {
    const start = new Date();
    start.setDate(start.getDate() - days);

    const logs = await prisma.healthLog.findMany({
      where: { userId, date: { gte: start } },
      orderBy: { date: "asc" },
    });

    const weekMap: Record<
      string,
      { workouts: number[]; moods: number[]; goals: number[]; weekStart: string }
    > = {};

    for (const log of logs) {
      const d = new Date(log.date);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const key = weekStart.toISOString().split("T")[0];

      if (!weekMap[key]) weekMap[key] = { workouts: [], moods: [], goals: [], weekStart: key };
      const data = log.data as Record<string, unknown>;

      if (log.type === "WORKOUT") {
        weekMap[key].workouts.push((data.calories as number) || 0);
      }
      if (log.type === "MOOD") {
        weekMap[key].moods.push((data.mood as number) || 3);
      }
      if (log.type === "GOAL") {
        weekMap[key].goals.push(log.score || 0);
      }
    }

    const weeks = Object.values(weekMap).sort((a, b) => a.weekStart.localeCompare(b.weekStart));

    return {
      calories: weeks.map((w) => ({
        week: w.weekStart,
        calories: w.workouts.reduce((s, c) => s + c, 0),
        sessions: w.workouts.length,
      })),
      mood: weeks.map((w) => ({
        week: w.weekStart,
        avgMood:
          w.moods.length > 0
            ? Math.round((w.moods.reduce((s, m) => s + m, 0) / w.moods.length) * 10) / 10
            : 0,
        entries: w.moods.length,
      })),
      goals: weeks.map((w) => ({
        week: w.weekStart,
        avgCompletion:
          w.goals.length > 0 ? Math.round(w.goals.reduce((s, g) => s + g, 0) / w.goals.length) : 0,
        count: w.goals.length,
      })),
    };
  },

  async getCalendar(userId: string, year: number, month: number) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    const logs = await prisma.healthLog.findMany({
      where: { userId, date: { gte: start, lte: end } },
      select: { date: true, score: true, type: true },
      orderBy: { date: "asc" },
    });

    const days: Record<string, { score: number; count: number; types: string[] }> = {};
    for (const log of logs) {
      const key = log.date.toISOString().split("T")[0];
      if (!days[key]) days[key] = { score: 0, count: 0, types: [] };
      days[key].score = Math.max(days[key].score, log.score || 0);
      days[key].count++;
      days[key].types.push(log.type);
    }

    return { year, month, days };
  },
};
