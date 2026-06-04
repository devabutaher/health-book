import { prisma } from "../lib/prisma";
import { AppError } from "../utils/AppError";

export interface WeightLogData {
  weight: number;
  date?: string;
  notes?: string | null;
  bodyFat?: number | null;
  waist?: number | null;
  hips?: number | null;
  chest?: number | null;
  arms?: number | null;
}

export const weightLogService = {
  async create(userId: string, data: WeightLogData) {
    return prisma.weightLog.create({
      data: {
        userId,
        weight: data.weight,
        bodyFat: data.bodyFat ?? null,
        waist: data.waist ?? null,
        hips: data.hips ?? null,
        chest: data.chest ?? null,
        arms: data.arms ?? null,
        date: data.date ? new Date(data.date) : new Date(),
        notes: data.notes ?? null,
      },
    });
  },

  async list(userId: string, params: { limit?: number; cursor?: string }) {
    const limit = (params.limit || 20) + 1;
    const logs = await prisma.weightLog.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: limit,
      ...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
    });
    const hasMore = logs.length === limit;
    if (hasMore) logs.pop();
    return { logs, nextCursor: hasMore ? logs[logs.length - 1]?.id : null, hasMore };
  },

  async getById(userId: string, id: string) {
    const log = await prisma.weightLog.findFirst({ where: { id, userId } });
    if (!log) throw new AppError(404, "Weight log not found");
    return log;
  },

  async update(userId: string, id: string, data: Partial<WeightLogData>) {
    const existing = await prisma.weightLog.findFirst({ where: { id, userId } });
    if (!existing) throw new AppError(404, "Weight log not found");

    const updateData: Record<string, unknown> = {};
    if (data.weight !== undefined) updateData.weight = data.weight;
    if (data.bodyFat !== undefined) updateData.bodyFat = data.bodyFat;
    if (data.waist !== undefined) updateData.waist = data.waist;
    if (data.hips !== undefined) updateData.hips = data.hips;
    if (data.chest !== undefined) updateData.chest = data.chest;
    if (data.arms !== undefined) updateData.arms = data.arms;
    if (data.date) updateData.date = new Date(data.date);
    if (data.notes !== undefined) updateData.notes = data.notes;

    return prisma.weightLog.update({ where: { id }, data: updateData });
  },

  async remove(userId: string, id: string) {
    const existing = await prisma.weightLog.findFirst({ where: { id, userId } });
    if (!existing) throw new AppError(404, "Weight log not found");
    await prisma.weightLog.delete({ where: { id } });
  },

  async getHistory(userId: string, days: number = 90) {
    const start = new Date();
    start.setDate(start.getDate() - days);

    const logs = await prisma.weightLog.findMany({
      where: { userId, date: { gte: start } },
      orderBy: { date: "asc" },
    });

    return {
      logs,
      total: logs.length,
      startWeight: logs[0]?.weight || null,
      endWeight: logs[logs.length - 1]?.weight || null,
    };
  },
};
