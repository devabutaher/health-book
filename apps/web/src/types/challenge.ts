export type ChallengeType = "SOLO" | "GROUP" | "PLATFORM" | "DUEL";
export type ChallengeCategory = "FITNESS" | "NUTRITION" | "MENTAL_HEALTH" | "SLEEP" | "GENERAL";
export type ChallengeDifficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export interface ChallengeMilestone {
  name: string;
  threshold: number;
  icon: string;
}

export interface ChallengeDayEntry {
  id: string;
  dayNumber: number;
  completed: boolean;
  notes: string | null;
  mediaUrls: string[];
  sharedToFeed: boolean;
  value?: number | null;
  completedAt: string | null;
  createdAt: string;
}

export interface ChallengeProgress {
  score: number;
  goal: number;
  pct: number;
  rank: number | null;
  completed: boolean;
  totalValue?: number;
  goalTarget?: number | null;
  goalUnit?: string | null;
  streak: number;
  currentDayNumber: number;
  achievedMilestones: string[];
  dayEntries: {
    id: string;
    dayNumber: number;
    completed: boolean;
    mediaUrls: string[];
    value?: number | null;
  }[];
}

export interface BeforeAfter {
  before: string | null;
  after: string | null;
  firstDay: number | null;
  lastDay: number | null;
  stats: {
    totalDays: number;
    completionRate: number;
    bestStreak: number;
  };
}

export interface ChallengeActivity {
  id: string;
  challengeId: string;
  userId: string;
  type: string;
  message: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  user: { id: string; name: string; username: string; avatar: string | null };
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: ChallengeType;
  difficulty: ChallengeDifficulty;
  dayCount: number;
  groupId: string | null;
  group: { id: string; name: string } | null;
  createdById: string;
  createdBy: { id: string; name: string; username: string; avatar: string | null } | null;
  startDate: string;
  endDate: string;
  entryFee: number | null;
  prize: string | null;
  goalTarget: number | null;
  goalUnit: string | null;
  category: ChallengeCategory;
  milestones: ChallengeMilestone[] | null;
  participantCount: number;
  isJoined: boolean;
  isSaved: boolean;
  isFull: boolean;
  requiredGroup: { id: string; name: string } | null;
  friendCount: number;
  totalCompleted: number;
  averageRating: number;
  ratingCount: number;
  myProgress: ChallengeProgress | null;
  isActive: boolean;
  createdAt: string;
}

export interface LeaderboardEntry {
  userId: string;
  user: { id: string; name: string; username: string; avatar: string | null };
  score: number;
  totalValue?: number;
  rank: number;
  completed: boolean;
  completedAt?: string | null;
  streak?: number;
}

export interface ChallengeTemplate {
  id: string;
  title: string;
  description: string;
  type: ChallengeType;
  category: ChallengeCategory;
  goalTarget: number | null;
  goalUnit: string | null;
  duration: number;
  milestones: ChallengeMilestone[];
  isOfficial: boolean;
  timesUsed: number;
}

export interface ChallengeCommentReaction {
  id: string;
  type: string;
  userId: string;
  createdAt: string;
}

export interface ChallengeComment {
  id: string;
  challengeId: string;
  userId: string;
  user: { id: string; name: string; username: string; avatar: string | null };
  content: string;
  parentId: string | null;
  reactions?: ChallengeCommentReaction[];
  replies?: ChallengeComment[];
  _count?: { replies: number };
  createdAt: string;
}

export interface ChallengeInvite {
  id: string;
  challengeId: string;
  challenge: { id: string; title: string; type: ChallengeType; category: ChallengeCategory };
  fromUser: { id: string; name: string; username: string; avatar: string | null };
  status: "PENDING" | "ACCEPTED" | "DECLINED";
  createdAt: string;
}

export interface ChallengeCalendar {
  days: {
    dayNumber: number;
    completed: boolean;
    mediaUrls: string[];
    notes: string | null;
    completedAt: string | null;
    value?: number | null;
  }[];
  dayCount: number;
}

export interface ChallengeStats {
  totalJoined: number;
  totalCompleted: number;
  completionRate: number;
  totalCheckIns: number;
  bestStreak: number;
  challengesByCategory: Record<string, number>;
  recentCompletions: { id: string; title: string; category: string }[];
}

export interface DuelParticipant {
  userId: string;
  user: { id: string; name: string; username: string; avatar: string | null };
  score: number;
  streak: number;
  completed: boolean;
  joinedAt: string;
}

export interface ChallengeDayPlan {
  id: string;
  challengeId: string;
  dayNumber: number;
  title: string | null;
  description: string | null;
  tips: string | null;
  mediaUrls: string[];
  duration: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChallengeRating {
  challengeId: string;
  userId: string;
  rating: number;
  review: string | null;
  createdAt: string;
  updatedAt: string;
  user: { id: string; name: string; username: string; avatar: string | null };
}

export interface ChallengeRatingsResponse {
  ratings: ChallengeRating[];
  averageRating: number;
  ratingCount: number;
}

export interface Duel {
  id: string;
  title: string;
  description: string;
  type: "DUEL";
  category: ChallengeCategory | null;
  difficulty: string;
  dayCount: number;
  startDate: string;
  endDate: string;
  createdBy: { id: string; name: string; username: string; avatar: string | null };
  participants: DuelParticipant[];
  winner: {
    userId: string;
    user: { id: string; name: string; username: string; avatar: string | null };
  } | null;
  isActive: boolean;
  createdAt: string;
}
