import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(50),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  username: z
    .string()
    .min(3, "Invalid username")
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, "Invalid username"),
  gender: z.enum(["male", "female"], { error: "Gender is required" }),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email"),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  bio: z.string().max(500).optional(),
  isPrivate: z.boolean().optional(),
  gender: z.enum(["male", "female"]).optional(),
});

export const createPostSchema = z.object({
  content: z.string().min(1).max(2000),
  mediaUrls: z.array(z.string()).max(10).optional(),
  privacy: z.enum(["PUBLIC", "FRIENDS", "PRIVATE"]).default("PUBLIC"),
  templateType: z.string().max(50).optional(),
  templateData: z.record(z.string(), z.unknown()).optional(),
  healthLogId: z.string().uuid().optional(),
  groupId: z.string().uuid().optional(),
  isDraft: z.boolean().optional(),
  scheduledAt: z.string().datetime().optional().nullable(),
  poll: z
    .object({
      question: z.string().min(1).max(500),
      options: z.array(z.string().min(1).max(200)).min(2).max(10),
      isMultipleChoice: z.boolean().optional(),
      expiresAt: z.string().datetime().optional(),
    })
    .optional(),
});

export const updatePostSchema = z.object({
  content: z.string().min(1).max(2000).optional(),
  privacy: z.enum(["PUBLIC", "FRIENDS", "PRIVATE"]).optional(),
  templateType: z.string().max(50).optional(),
  templateData: z.record(z.string(), z.unknown()).optional(),
  healthLogId: z.string().uuid().optional(),
  isDraft: z.boolean().optional(),
  scheduledAt: z.string().datetime().optional().nullable(),
});

export const reactionSchema = z.object({
  type: z.enum(["INSPIRED", "CLAP", "KEEP_IT_UP", "HEALING", "LOVE"]),
});

export const createCommentSchema = z.object({
  content: z.string().min(1).max(1000),
  parentId: z.string().uuid().optional(),
});

export const healthLogTypeEnum = z.enum(["ROUTINE", "GOAL", "WORKOUT", "MOOD", "QUICK"]);

export const createHealthLogSchema = z.object({
  type: healthLogTypeEnum,
  date: z.string().optional(),
  data: z.record(z.string(), z.unknown()),
  isPublic: z.boolean().optional(),
});

export const updateHealthLogSchema = z.object({
  type: healthLogTypeEnum.optional(),
  date: z.string().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
  isPublic: z.boolean().optional(),
});

export const createPeriodLogSchema = z.object({
  startDate: z.string(),
  endDate: z.string().optional(),
  cycleLength: z.number().int().positive().optional(),
  flowIntensity: z.string().optional(),
  symptoms: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export const updatePeriodLogSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().nullable().optional(),
  cycleLength: z.number().int().positive().nullable().optional(),
  flowIntensity: z.string().nullable().optional(),
  symptoms: z.array(z.string()).optional(),
  notes: z.string().nullable().optional(),
});

export const createWeightLogSchema = z.object({
  weight: z.number().positive(),
  date: z.string().optional(),
  notes: z.string().optional(),
  bodyFat: z.number().positive().optional(),
  waist: z.number().positive().optional(),
  hips: z.number().positive().optional(),
  chest: z.number().positive().optional(),
  arms: z.number().positive().optional(),
});

export const updateWeightLogSchema = z.object({
  weight: z.number().positive().optional(),
  date: z.string().optional(),
  notes: z.string().nullable().optional(),
  bodyFat: z.number().positive().nullable().optional(),
  waist: z.number().positive().nullable().optional(),
  hips: z.number().positive().nullable().optional(),
  chest: z.number().positive().nullable().optional(),
  arms: z.number().positive().nullable().optional(),
});

export const shareHealthLogSchema = z.object({
  content: z.string().min(1).max(2000),
});

// ── Phase 3: Messaging ──

export const createConversationSchema = z.object({
  participantIds: z.array(z.string().uuid()).min(1).max(250),
  isGroup: z.boolean().optional(),
  groupName: z.string().max(100).optional(),
});

export const sendMessageSchema = z
  .object({
    content: z.string().max(5000).optional(),
    mediaUrl: z.string().url().optional(),
    sharedPostId: z.string().uuid().optional(),
    messageType: z
      .enum(["text", "story_comment", "story_quiz_answer", "story_poll_vote"])
      .optional(),
    storyId: z.string().uuid().optional(),
    storyReplyData: z
      .object({
        storyType: z.enum(["media", "quiz", "poll"]).optional(),
        question: z.string().optional(),
        options: z.array(z.string()).optional(),
        selectedOption: z.string().optional(),
        optionIndex: z.number().int().optional(),
        commentText: z.string().optional(),
        textOverlay: z.string().optional(),
        correct: z.boolean().optional(),
      })
      .optional(),
  })
  .refine((d) => d.content || d.mediaUrl || d.sharedPostId || d.messageType, {
    message: "Message must have content, media, a shared post, or a message type",
  });

// ── Phase 3: Groups ──

export const createGroupSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(2000).optional(),
  avatar: z.string().optional(),
  coverPhoto: z.string().optional(),
  type: z.enum(["PUBLIC", "PRIVATE", "SECRET"]).default("PUBLIC"),
});

export const updateGroupSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(2000).optional(),
  avatar: z.string().url().optional(),
  coverPhoto: z.string().url().optional(),
  type: z.enum(["PUBLIC", "PRIVATE", "SECRET"]).optional(),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(["ADMIN", "MODERATOR", "MEMBER"]),
});

// ── Phase 3: Challenges ──

const challengeTypeEnum = z.enum(["SOLO", "GROUP", "PLATFORM", "DUEL"]);
const challengeCategoryEnum = z.enum(["FITNESS", "NUTRITION", "MENTAL_HEALTH", "SLEEP", "GENERAL"]);
const challengeDifficultyEnum = z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]);
const challengeMilestoneSchema = z
  .array(
    z.object({
      name: z.string(),
      threshold: z.number(),
      icon: z.string(),
    }),
  )
  .optional();

export const createChallengeSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  type: challengeTypeEnum,
  groupId: z.string().uuid().optional(),
  startDate: z.string(),
  endDate: z.string(),
  entryFee: z.number().positive().optional(),
  prize: z.string().max(500).optional(),
  goalTarget: z.number().int().positive().optional(),
  goalUnit: z.string().max(50).optional(),
  category: challengeCategoryEnum.optional(),
  difficulty: challengeDifficultyEnum.optional(),
  dayCount: z.number().int().positive().optional(),
  milestones: challengeMilestoneSchema,
  templateId: z.string().uuid().optional(),
});

export const updateChallengeSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(5000).optional(),
  type: challengeTypeEnum.optional(),
  groupId: z.string().uuid().nullable().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  entryFee: z.number().positive().nullable().optional(),
  prize: z.string().max(500).nullable().optional(),
  goalTarget: z.number().int().positive().nullable().optional(),
  goalUnit: z.string().max(50).nullable().optional(),
  category: challengeCategoryEnum.optional(),
  difficulty: challengeDifficultyEnum.optional(),
  dayCount: z.number().int().positive().optional(),
  milestones: challengeMilestoneSchema,
});

export const checkInSchema = z.object({
  dayNumber: z.number().int().positive(),
  completed: z.boolean().default(true),
  notes: z.string().max(2000).optional(),
  mediaUrls: z.array(z.string()).max(10).optional(),
  sharedToFeed: z.boolean().default(false),
  value: z.number().positive().optional(),
});

export const commentReactionSchema = z.object({
  type: z.enum(["INSPIRED", "CLAP", "KEEP_IT_UP", "HEALING", "LOVE", "FIRE", "STRONG", "HUNDRED"]),
});

export const duelSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000).optional(),
  targetUserId: z.string().uuid(),
  startDate: z.string(),
  endDate: z.string(),
  goalTarget: z.number().int().positive().optional(),
  goalUnit: z.string().max(50).optional(),
  category: challengeCategoryEnum.optional(),
  dayCount: z.number().int().positive().optional(),
});

// ── Phase 3: Stories ──

export const reactStorySchema = z.object({
  emoji: z.string().min(1, "Emoji is required").max(10),
});

export const createStorySchema = z
  .object({
    type: z.enum(["media", "text", "quiz", "poll"]).default("media"),
    privacy: z.enum(["public", "friends", "private"]).default("friends"),
    mediaUrl: z.string().url().optional(),
    mediaType: z.enum(["image", "video"]).optional(),
    duration: z.number().int().positive().optional(),
    textOverlay: z.string().max(200).optional(),
    textColor: z.string().optional(),
    textBgColor: z.string().optional(),
    textFontSize: z.number().int().min(12).max(72).optional(),
    textFontWeight: z.enum(["normal", "bold"]).optional(),
    textPosition: z.string().optional(), // JSON "{x,y}" or legacy "top"|"center"|"bottom"
    backgroundColor: z.string().optional(),
    stickerData: z
      .object({
        type: z.enum(["quiz", "poll"]),
        question: z.string().optional(),
        options: z.array(z.string()).optional(),
        correctOptionIndex: z.number().int().nonnegative().optional(),
        backgroundColor: z.string().optional(),
      })
      .optional(),
  })
  .refine(
    (d) => {
      if (d.type === "media") return !!d.mediaUrl;
      if (d.type === "text") return !!d.textOverlay;
      return true;
    },
    { message: "Media stories require mediaUrl, text stories require textOverlay" },
  );

// ── Story Highlights ──

export const createHighlightSchema = z.object({
  title: z.string().min(1).max(100),
  coverUrl: z.string().url().optional(),
});

export const updateHighlightSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  coverUrl: z.string().url().optional(),
});

export const addHighlightItemSchema = z.object({
  storyId: z.string().uuid(),
});

export const reorderHighlightItemsSchema = z.object({
  itemIds: z.array(z.string().uuid()),
});

// ── Phase 3: Reels ──

export const createReelSchema = z.object({
  videoUrl: z.string().url(),
  caption: z.string().max(2000).optional(),
  thumbnailUrl: z.string().url().optional(),
});

export const createReelCommentSchema = z.object({
  content: z.string().min(1).max(1000),
});

export const updateReelSchema = z.object({
  caption: z.string().max(2000).optional(),
});

// ── Phase 3: Messaging (additional) ──

export const addParticipantSchema = z.object({
  userId: z.string().uuid(),
});

// ── Phase 3: Groups (additional) ──

export const inviteUserSchema = z.object({
  userId: z.string().min(1, "Username or userId required"),
});

// ── Phase 1: Auth (OAuth) ──

export const oauthSchema = z.object({
  supabaseToken: z.string().min(1, "Supabase token required"),
  refreshToken: z.string().optional(),
});
