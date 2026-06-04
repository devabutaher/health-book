export type GroupType = "PUBLIC" | "PRIVATE" | "SECRET";
export type GroupRole = "ADMIN" | "MODERATOR" | "MEMBER";

export interface Group {
  id: string;
  name: string;
  description: string | null;
  avatar: string | null;
  coverPhoto: string | null;
  type: GroupType;
  createdById: string;
  memberCount: number;
  isMember: boolean;
  myRole: GroupRole | null;
  createdAt: string;
  updatedAt: string;
}

export interface GroupMember {
  userId: string;
  user: { id: string; name: string; username: string; avatar: string | null; isVerified: boolean };
  role: GroupRole;
  joinedAt: string;
}

export interface GroupJoinRequest {
  id: string;
  groupId: string;
  userId: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  user: { id: string; name: string; username: string; avatar: string | null; isVerified: boolean };
}

export interface GroupInvite {
  id: string;
  groupId: string;
  userId: string;
  invitedBy: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED";
  createdAt: string;
  group?: Group & { _count?: { members: number } };
  user: { id: string; name: string; username: string; avatar: string | null; isVerified: boolean };
  inviter: { id: string; name: string; username: string; avatar: string | null };
}

export interface GroupListData {
  groups: Group[];
  nextCursor: string | null;
  hasMore: boolean;
}
