export interface ReelUser {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
  isFollowing?: boolean;
}

export interface Reel {
  id: string;
  videoUrl: string;
  caption: string | null;
  thumbnailUrl: string | null;
  user: ReelUser;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  comments?: ReelComment[];
  createdAt: string;
}

export interface ReelComment {
  id: string;
  content: string;
  user: ReelUser;
  createdAt: string;
}
