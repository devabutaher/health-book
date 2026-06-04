import { prisma } from "../lib/prisma";
import type { ChallengeType, ChallengeCategory } from "../../generated/prisma";

const DEFAULT_TEMPLATES = [
  {
    title: "30-Day Plank Challenge",
    description: "Build core strength with daily planks. Start with 20s, build up to 2min!",
    type: "SOLO" as ChallengeType,
    category: "FITNESS" as ChallengeCategory,
    goalTarget: 30,
    goalUnit: "minutes",
    duration: 30,
    isOfficial: true,
    milestones: [
      { name: "Bronze", threshold: 10, icon: "🥉" },
      { name: "Silver", threshold: 20, icon: "🥈" },
      { name: "Gold", threshold: 30, icon: "🥇" },
    ],
  },
  {
    title: "7-Day Mindfulness",
    description:
      "Spend 10 minutes each day on mindfulness meditation. Reduce stress, improve focus.",
    type: "SOLO" as ChallengeType,
    category: "MENTAL_HEALTH" as ChallengeCategory,
    goalTarget: 7,
    goalUnit: "sessions",
    duration: 7,
    isOfficial: true,
    milestones: [
      { name: "Bronze", threshold: 3, icon: "🥉" },
      { name: "Silver", threshold: 5, icon: "🥈" },
      { name: "Gold", threshold: 7, icon: "🥇" },
    ],
  },
  {
    title: "10k Steps Daily",
    description:
      "Walk 10,000 steps every day for a month. Track your progress and feel the difference!",
    type: "SOLO" as ChallengeType,
    category: "FITNESS" as ChallengeCategory,
    goalTarget: 300000,
    goalUnit: "steps",
    duration: 30,
    isOfficial: true,
    milestones: [
      { name: "Bronze", threshold: 100000, icon: "🥉" },
      { name: "Silver", threshold: 200000, icon: "🥈" },
      { name: "Gold", threshold: 300000, icon: "🥇" },
    ],
  },
  {
    title: "Water Tracker",
    description: "Drink 8 glasses of water daily for 30 days. Stay hydrated, stay healthy!",
    type: "SOLO" as ChallengeType,
    category: "NUTRITION" as ChallengeCategory,
    goalTarget: 240,
    goalUnit: "glasses",
    duration: 30,
    isOfficial: true,
    milestones: [
      { name: "Bronze", threshold: 80, icon: "🥉" },
      { name: "Silver", threshold: 160, icon: "🥈" },
      { name: "Gold", threshold: 240, icon: "🥇" },
    ],
  },
  {
    title: "8-Hour Sleep Challenge",
    description: "Prioritize sleep! Get 8 hours of quality sleep each night for 21 days.",
    type: "SOLO" as ChallengeType,
    category: "SLEEP" as ChallengeCategory,
    goalTarget: 168,
    goalUnit: "hours",
    duration: 21,
    isOfficial: true,
    milestones: [
      { name: "Bronze", threshold: 56, icon: "🥉" },
      { name: "Silver", threshold: 112, icon: "🥈" },
      { name: "Gold", threshold: 168, icon: "🥇" },
    ],
  },
  {
    title: "Sugar Free 2 Weeks",
    description: "Cut out added sugar for 14 days. Notice the energy boost!",
    type: "SOLO" as ChallengeType,
    category: "NUTRITION" as ChallengeCategory,
    goalTarget: 14,
    goalUnit: "days",
    duration: 14,
    isOfficial: true,
    milestones: [
      { name: "Bronze", threshold: 5, icon: "🥉" },
      { name: "Silver", threshold: 10, icon: "🥈" },
      { name: "Gold", threshold: 14, icon: "🥇" },
    ],
  },
  {
    title: "Daily Gratitude",
    description: "Write 3 things you're grateful for every day for 7 days. Boost happiness!",
    type: "SOLO" as ChallengeType,
    category: "MENTAL_HEALTH" as ChallengeCategory,
    goalTarget: 7,
    goalUnit: "entries",
    duration: 7,
    isOfficial: true,
    milestones: [
      { name: "Bronze", threshold: 3, icon: "🥉" },
      { name: "Silver", threshold: 5, icon: "🥈" },
      { name: "Gold", threshold: 7, icon: "🥇" },
    ],
  },
  {
    title: "Group Fitness Frenzy",
    description: "Compete with your group! Who can log the most workout minutes?",
    type: "GROUP" as ChallengeType,
    category: "FITNESS" as ChallengeCategory,
    goalTarget: 500,
    goalUnit: "minutes",
    duration: 14,
    isOfficial: true,
    milestones: [
      { name: "Bronze", threshold: 150, icon: "🥉" },
      { name: "Silver", threshold: 300, icon: "🥈" },
      { name: "Gold", threshold: 500, icon: "🥇" },
    ],
  },
];

export const challengeTemplateService = {
  async list(category?: ChallengeCategory, type?: ChallengeType) {
    await this.seedIfEmpty();

    const where: Record<string, unknown> = {};
    if (category) where.category = category;
    if (type) where.type = type;

    return prisma.challengeTemplate.findMany({
      where,
      orderBy: [{ isOfficial: "desc" }, { timesUsed: "desc" }],
    });
  },

  async getById(id: string) {
    return prisma.challengeTemplate.findUniqueOrThrow({ where: { id } });
  },

  async seedIfEmpty() {
    const count = await prisma.challengeTemplate.count();
    if (count > 0) return { seeded: false, count };

    await prisma.challengeTemplate.createMany({ data: DEFAULT_TEMPLATES });
    return { seeded: true, count: DEFAULT_TEMPLATES.length };
  },
};
