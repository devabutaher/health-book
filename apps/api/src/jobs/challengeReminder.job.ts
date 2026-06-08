import cron from "node-cron";
import { prisma } from "../lib/prisma";
import { notificationService } from "../services/notification.service";

export function startChallengeReminderJob() {
  // Run daily at 09:00 and 20:00
  cron.schedule("0 9,20 * * *", async () => {
    try {
      const now = new Date();
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(now);
      todayEnd.setHours(23, 59, 59, 999);

      const activeChallenges = await prisma.challenge.findMany({
        where: {
          isActive: true,
          startDate: { lte: now },
          endDate: { gte: now },
        },
        select: {
          id: true,
          title: true,
          endDate: true,
          participants: {
            select: { userId: true },
          },
        },
      });

      let reminderCount = 0;
      let endingSoonCount = 0;

      for (const challenge of activeChallenges) {
        const participantIds = challenge.participants.map((p) => p.userId);

        // Get user IDs who already checked in today
        const todayEntryUsers = await prisma.challengeDayEntry.findMany({
          where: {
            challengeId: challenge.id,
            userId: { in: participantIds },
            createdAt: { gte: todayStart, lte: todayEnd },
            completed: true,
          },
          select: { userId: true },
          distinct: ["userId"],
        });
        const checkedInToday = new Set(todayEntryUsers.map((e) => e.userId));

        // Send reminders to those who haven't checked in
        for (const userId of participantIds) {
          if (checkedInToday.has(userId)) continue;

          await notificationService.create({
            type: "CHECK_IN_REMINDER",
            userId,
            message: `Don't forget to check in for "${challenge.title}" today!`,
          });
          reminderCount++;
        }

        // Check if challenge is ending within 3 days
        const daysUntilEnd = Math.ceil((challenge.endDate.getTime() - now.getTime()) / 86400000);
        if (daysUntilEnd > 0 && daysUntilEnd <= 3) {
          for (const userId of participantIds) {
            await notificationService.create({
              type: "CHALLENGE_ENDING_SOON",
              userId,
              message: `"${challenge.title}" ends in ${daysUntilEnd} day${daysUntilEnd !== 1 ? "s" : ""}!`,
            });
            endingSoonCount++;
          }
        }
      }

      if (reminderCount > 0 || endingSoonCount > 0) {
        console.log(
          `[Cron] Sent ${reminderCount} check-in reminder(s), ${endingSoonCount} ending-soon notification(s)`,
        );
      }
    } catch (err) {
      console.error("[Cron] Challenge reminder check failed:", err);
    }
  });
}
