export interface StorySticker {
  type: "quiz" | "poll";
  question?: string;
  options?: string[];
  correctOptionIndex?: number;
  backgroundColor?: string;
}

export interface Story {
  id: string;
  userId: string;
  user: { id: string; name: string; username: string; avatar: string | null };
  type: "media" | "text" | "quiz" | "poll";
  privacy?: "public" | "friends" | "private";
  mediaUrl: string | null;
  mediaType: "image" | "video" | null;
  duration: number | null;
  textOverlay: string | null;
  textColor?: string;
  textBgColor?: string;
  textFontSize?: number;
  textFontWeight?: string;
  textPosition?: string; // JSON string "{ x: number, y: number }" or legacy "top"|"center"|"bottom"
  backgroundColor?: string;
  stickerData?: StorySticker;
  expiresAt: string;
  createdAt: string;
  viewed: boolean;
  reaction?: string | null;
  reactionCount?: number;
}

export interface StoryGroup {
  user: { id: string; name: string; username: string; avatar: string | null };
  stories: Story[];
}

export interface StoryInteractionItem {
  userId: string;
  user: { id: string; name: string; username: string; avatar: string | null };
  viewedAt: string;
  reaction: string | null;
}

export interface StoryInteractions {
  totalViews: number;
  totalReactions: number;
  emojiBreakdown: Record<string, number>;
  items: StoryInteractionItem[];
}

export interface StoryHighlight {
  id: string;
  title: string;
  coverUrl: string | null;
  items: StoryHighlightItem[];
  createdAt: string;
}

export interface StoryHighlightItem {
  id: string;
  highlightId: string;
  storyId: string;
  order: number;
  story: { id: string; mediaUrl: string; mediaType: string };
  createdAt: string;
}
