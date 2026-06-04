import { prisma } from "../lib/prisma";
import { AppError } from "../utils/AppError";

export const periodLogService = {
  async create(
    userId: string,
    data: {
      startDate: string;
      endDate?: string;
      cycleLength?: number;
      flowIntensity?: string;
      symptoms?: string[];
      notes?: string;
    },
  ) {
    return prisma.periodLog.create({
      data: {
        userId,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        cycleLength: data.cycleLength || null,
        flowIntensity: data.flowIntensity || null,
        symptoms: data.symptoms || [],
        notes: data.notes || null,
      },
    });
  },

  async list(userId: string, params: { limit?: number; cursor?: string }) {
    const limit = (params.limit || 20) + 1;
    const logs = await prisma.periodLog.findMany({
      where: { userId },
      orderBy: { startDate: "desc" },
      take: limit,
      ...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
    });
    const hasMore = logs.length === limit;
    if (hasMore) logs.pop();
    return { logs, nextCursor: hasMore ? logs[logs.length - 1]?.id : null, hasMore };
  },

  async getById(userId: string, id: string) {
    const log = await prisma.periodLog.findFirst({ where: { id, userId } });
    if (!log) throw new AppError(404, "Period log not found");
    return log;
  },

  async update(
    userId: string,
    id: string,
    data: {
      startDate?: string;
      endDate?: string | null;
      cycleLength?: number | null;
      flowIntensity?: string | null;
      symptoms?: string[];
      notes?: string | null;
    },
  ) {
    const existing = await prisma.periodLog.findFirst({ where: { id, userId } });
    if (!existing) throw new AppError(404, "Period log not found");

    const updateData: Record<string, unknown> = {};
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate !== undefined)
      updateData.endDate = data.endDate ? new Date(data.endDate) : null;
    if (data.cycleLength !== undefined) updateData.cycleLength = data.cycleLength;
    if (data.flowIntensity !== undefined) updateData.flowIntensity = data.flowIntensity;
    if (data.symptoms !== undefined) updateData.symptoms = data.symptoms;
    if (data.notes !== undefined) updateData.notes = data.notes;

    return prisma.periodLog.update({ where: { id }, data: updateData });
  },

  async remove(userId: string, id: string) {
    const existing = await prisma.periodLog.findFirst({ where: { id, userId } });
    if (!existing) throw new AppError(404, "Period log not found");
    await prisma.periodLog.delete({ where: { id } });
  },
};
