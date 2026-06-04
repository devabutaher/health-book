import { prisma } from "../lib/prisma";
import { AppError } from "../utils/AppError";

export const highlightService = {
  async getAll(userId: string) {
    return prisma.storyHighlight.findMany({
      where: { userId },
      include: {
        items: {
          orderBy: { order: "asc" },
          include: {
            story: {
              select: { id: true, mediaUrl: true, mediaType: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async create(userId: string, data: { title: string; coverUrl?: string }) {
    return prisma.storyHighlight.create({
      data: { userId, title: data.title, coverUrl: data.coverUrl },
      include: { items: true },
    });
  },

  async update(id: string, userId: string, data: { title?: string; coverUrl?: string }) {
    const highlight = await prisma.storyHighlight.findUniqueOrThrow({ where: { id } });
    if (highlight.userId !== userId) throw new AppError(403, "Not your highlight");
    return prisma.storyHighlight.update({
      where: { id },
      data,
      include: { items: true },
    });
  },

  async delete(id: string, userId: string) {
    const highlight = await prisma.storyHighlight.findUniqueOrThrow({ where: { id } });
    if (highlight.userId !== userId) throw new AppError(403, "Not your highlight");
    await prisma.storyHighlight.delete({ where: { id } });
  },

  async addItem(highlightId: string, userId: string, storyId: string) {
    const highlight = await prisma.storyHighlight.findUniqueOrThrow({ where: { id: highlightId } });
    if (highlight.userId !== userId) throw new AppError(403, "Not your highlight");
    const maxOrder = await prisma.storyHighlightItem.findFirst({
      where: { highlightId },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    return prisma.storyHighlightItem.create({
      data: { highlightId, storyId, order: (maxOrder?.order ?? -1) + 1 },
      include: {
        story: { select: { id: true, mediaUrl: true, mediaType: true } },
      },
    });
  },

  async removeItem(highlightId: string, userId: string, itemId: string) {
    const highlight = await prisma.storyHighlight.findUniqueOrThrow({ where: { id: highlightId } });
    if (highlight.userId !== userId) throw new AppError(403, "Not your highlight");
    await prisma.storyHighlightItem.delete({ where: { id: itemId } });
  },

  async reorderItems(highlightId: string, userId: string, itemIds: string[]) {
    const highlight = await prisma.storyHighlight.findUniqueOrThrow({ where: { id: highlightId } });
    if (highlight.userId !== userId) throw new AppError(403, "Not your highlight");
    await prisma.$transaction(
      itemIds.map((id, index) =>
        prisma.storyHighlightItem.update({
          where: { id },
          data: { order: index },
        }),
      ),
    );
  },
};
