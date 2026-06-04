import type { PostUser } from "./post";

export interface Comment {
  id: string;
  content: string;
  postId: string;
  userId: string;
  parentId: string | null;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  user: PostUser;
  replies?: Comment[];
}
