export type PostPrivacy = "PUBLIC" | "FRIENDS" | "PRIVATE";
export type ReactionType = "INSPIRED" | "CLAP" | "KEEP_IT_UP" | "HEALING" | "LOVE";

export interface PostUser {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
  isVerified: boolean;
  isFollowing?: boolean;
}

export interface PostReaction {
  type: ReactionType;
  userId: string;
}

export interface PostHealthLog {
  id: string;
  type: string;
  score: number | null;
  data: Record<string, unknown>;
  date: string;
}

export interface PostCount {
  reactions?: number;
  comments?: number;
}

export interface PostPollVote {
  optionIndex: number;
  _count: number;
}

export interface PostPoll {
  id: string;
  postId: string;
  question: string;
  options: string[];
  isMultipleChoice: boolean;
  expiresAt: string | null;
  createdAt: string;
  votes: PostPollVote[];
  userVote: number | null;
  totalVotes: number;
}

export interface Post {
  id: string;
  content: string | null;
  mediaUrls: string[];
  privacy: PostPrivacy;
  userId: string;
  groupId?: string | null;
  templateType?: string | null;
  templateData?: Record<string, unknown> | null;
  healthLogId?: string | null;
  isDraft?: boolean;
  scheduledAt?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  user: PostUser;
  reactions?: PostReaction[];
  _count?: PostCount;
  healthLog?: PostHealthLog | null;
  poll?: PostPoll | null;
}

export interface PostFeedData {
  posts: Post[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface PostApiResponse {
  success: boolean;
  data: PostFeedData;
}

export interface PostSingleResponse {
  success: boolean;
  data: Post;
}

export interface PostQuizResult {
  isCorrect: boolean;
  correctIndex: number;
}

export interface PostQuizResults {
  totalAnswers: number;
  correctCount: number;
  optionCounts: { optionIndex: number; _count: number }[];
}

export interface CreatePostPayload {
  content: string;
  mediaUrls?: string[];
  privacy?: string;
  templateType?: string;
  templateData?: Record<string, unknown>;
  healthLogId?: string;
  isDraft?: boolean;
  scheduledAt?: string | null;
  poll?: {
    question: string;
    options: string[];
    isMultipleChoice?: boolean;
    expiresAt?: string;
  };
}
