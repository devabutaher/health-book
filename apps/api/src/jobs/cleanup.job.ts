import cron from "node-cron";
import { storyService } from "../services/story.service";

export const startCleanupJobs = () => {
  cron.schedule("0 * * * *", async () => {
    try {
      await storyService.cleanupExpired();
      console.log("[Cron] Expired stories cleaned up");
    } catch (err) {
      console.error("[Cron] Story cleanup failed:", err);
    }
  });
};
