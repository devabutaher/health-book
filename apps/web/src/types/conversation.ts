export interface Conversation {
  id: string;
  isGroup: boolean;
  groupName: string | null;
  groupAvatar: string | null;
  participants: ConversationParticipant[];
  lastMessage: Message | null;
  unreadCount: number;
  isMuted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationParticipant {
  userId: string;
  user: { id: string; name: string; username: string; avatar: string | null };
  role?: string;
  joinedAt: string;
  isMuted: boolean;
  lastReadAt: string | null;
}

export interface StoryReplyData {
  storyType?: "media" | "quiz" | "poll";
  question?: string;
  options?: string[];
  selectedOption?: string;
  optionIndex?: number;
  commentText?: string;
  textOverlay?: string;
  correct?: boolean;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  sender: { id: string; name: string; username: string; avatar: string | null };
  content: string | null;
  mediaUrl: string | null;
  sharedPostId: string | null;
  messageType?: string;
  storyId?: string;
  storyReplyData?: StoryReplyData;
  isDeleted: boolean;
  createdAt: string;
}
