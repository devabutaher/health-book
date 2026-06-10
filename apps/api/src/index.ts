import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import postRoutes from "./routes/post.routes";
import commentRoutes from "./routes/comment.routes";
import healthLogRoutes from "./routes/healthLog.routes";
import searchRoutes from "./routes/search.routes";
import notificationRoutes from "./routes/notification.routes";
import periodLogRoutes from "./routes/periodLog.routes";
import weightLogRoutes from "./routes/weightLog.routes";
import messageRoutes from "./routes/message.routes";
import groupRoutes from "./routes/group.routes";
import challengeRoutes from "./routes/challenge.routes";
import storyRoutes from "./routes/story.routes";
import highlightRoutes from "./routes/highlight.routes";
import reelRoutes from "./routes/reel.routes";
import groupPollRoutes from "./routes/groupPoll.routes";
import groupEventRoutes from "./routes/groupEvent.routes";
import newsRoutes from "./routes/news.routes";
import healthRoutes from "./routes/health.routes";
import postPollRoutes from "./routes/postPoll.routes";
import postQuizRoutes from "./routes/postQuiz.routes";
import pushRoutes from "./routes/push.routes";
import { rateLimiter, errorHandler } from "./middleware";
import { startCleanupJobs } from "./jobs/cleanup.job";
import { publishScheduledPosts } from "./jobs/publishScheduled";
import { startStreakAtRiskJob } from "./jobs/streakAtRisk.job";
import { startChallengeReminderJob } from "./jobs/challengeReminder.job";

const app = express();
const port = process.env["PORT"] || 5000;

app.use(helmet());
app.use(
  cors({
    origin: process.env["CLIENT_URL"],
    credentials: true,
  }),
);
app.use(compression());
app.use(express.json());
app.use(cookieParser());
app.use(rateLimiter);

app.get("/api/health", (_req, res) => {
  res.json({ success: true, message: "API running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/health-logs", healthLogRoutes);
app.use("/api/period-logs", periodLogRoutes);
app.use("/api/weight-logs", weightLogRoutes);

// Phase 3 routes
app.use("/api/messages", messageRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/challenges", challengeRoutes);
app.use("/api/stories", storyRoutes);
app.use("/api/highlights", highlightRoutes);
app.use("/api/reels", reelRoutes);
app.use("/api/groups", groupPollRoutes);
app.use("/api/groups", groupEventRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/post-polls", postPollRoutes);
app.use("/api/post-quiz", postQuizRoutes);
app.use("/api/push", pushRoutes);

app.use(errorHandler);

app.listen(port, () => {
  console.log(`API server running on http://localhost:${port}`);
  startCleanupJobs();
  publishScheduledPosts();
  setInterval(publishScheduledPosts, 60 * 1000);
  startStreakAtRiskJob();
  startChallengeReminderJob();
});
