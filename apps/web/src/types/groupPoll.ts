export interface GroupPoll {
  id: string;
  groupId: string;
  createdById: string;
  creator?: { id: string; name: string; username: string; avatar: string | null };
  question: string;
  options: string[];
  isMultipleChoice: boolean;
  expiresAt: string | null;
  createdAt: string;
  votes: { optionIndex: number; _count: number }[];
  userVote: number | null;
  totalVotes: number;
}
