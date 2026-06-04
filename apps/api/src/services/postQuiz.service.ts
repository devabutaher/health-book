import { prisma } from "../lib/prisma";
import { AppError } from "../utils/AppError";

export const postQuizService = {
  async answer(postId: string, userId: string, selectedIndex: number) {
    const post = await prisma.post.findUniqueOrThrow({
      where: { id: postId },
      select: { templateData: true },
    });

    if (
      !post.templateData ||
      typeof post.templateData !== "object" ||
      Array.isArray(post.templateData)
    ) {
      throw new AppError(400, "Post has no quiz data");
    }

    const quizData = post.templateData as { correctIndex?: number; options?: string[] };
    if (quizData.correctIndex === undefined || !Array.isArray(quizData.options)) {
      throw new AppError(400, "Invalid quiz data");
    }

    if (selectedIndex < 0 || selectedIndex >= quizData.options.length) {
      throw new AppError(400, "Invalid option");
    }

    const existing = await prisma.postQuizAnswer.findUnique({
      where: { postId_userId: { postId, userId } },
    });
    if (existing) {
      throw new AppError(409, "Already answered");
    }

    const isCorrect = selectedIndex === quizData.correctIndex;

    await prisma.postQuizAnswer.create({
      data: { postId, userId, selectedIndex, isCorrect },
    });

    return { isCorrect, correctIndex: quizData.correctIndex };
  },

  async results(postId: string) {
    const post = await prisma.post.findUniqueOrThrow({
      where: { id: postId },
      select: { templateData: true },
    });

    if (
      !post.templateData ||
      typeof post.templateData !== "object" ||
      Array.isArray(post.templateData)
    ) {
      throw new AppError(400, "Post has no quiz data");
    }

    const quizData = post.templateData as { options?: string[] };
    const optionCount = quizData.options?.length ?? 0;

    const answers = await prisma.postQuizAnswer.findMany({
      where: { postId },
      select: { selectedIndex: true, isCorrect: true },
    });

    const optionCounts = Array.from({ length: optionCount }, (_, i) => ({
      optionIndex: i,
      _count: answers.filter((a) => a.selectedIndex === i).length,
    }));

    return {
      totalAnswers: answers.length,
      correctCount: answers.filter((a) => a.isCorrect).length,
      optionCounts,
    };
  },
};
