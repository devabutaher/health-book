import cron from "node-cron";
import { prisma } from "../lib/prisma";
import { notificationService } from "../services/notification.service";

export function startStreakAtRiskJob() {
  cron.schedule("0 20 * * *", async () => {
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const yesterdayEnd = new Date(todayStart);
      yesterdayEnd.setMilliseconds(-1);

      const users = await prisma.user.findMany({
        select: { id: true },
        where: {
          healthLogs: {
            some: {
              date: { lte: yesterdayEnd },
            },
          },
        },
      });

      const todayLogUserIds = await prisma.healthLog.findMany({
        where: { date: { gte: todayStart, lte: todayEnd } },
        select: { userId: true },
        distinct: ["userId"],
      });

      const todayLoggers = new Set(todayLogUserIds.map((l) => l.userId));

      let count = 0;
      for (const user of users) {
        if (todayLoggers.has(user.id)) continue;

        const recentLogs = await prisma.healthLog.findMany({
          where: { userId: user.id },
          orderBy: { date: "desc" },
          take: 365,
          select: { date: true },
        });

        const logDates = new Set(recentLogs.map((l) => l.date.toISOString().split("T")[0]));
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

        if (streak > 0) {
          notificationService
            .create({
              type: "STREAK_AT_RISK",
              userId: user.id,
              message: "Log your health data to keep your streak alive!",
            })
            .catch(() => {});
          count++;
        }
      }

      if (count > 0) {
        console.log(`[Cron] Sent ${count} streak-at-risk notification(s)`);
      }
    } catch (err) {
      console.error("[Cron] Streak-at-risk check failed:", err);
    }
  });
}
