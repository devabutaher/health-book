"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Shield, UserMinus, UserCheck, UserX } from "lucide-react";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import {
  useGetGroupQuery,
  useGetGroupMembersQuery,
  useUpdateMemberRoleMutation,
  useRemoveMemberMutation,
  useGetJoinRequestsQuery,
  useApproveJoinRequestMutation,
  useRejectJoinRequestMutation,
  useGetGroupInvitesQuery,
} from "@/redux/api/groupsApi";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import type { GroupRole } from "@/types/group";
import { toast } from "sonner";

const ROLE_BADGE: Record<GroupRole, { label: string; color: string }> = {
  ADMIN: { label: "Admin", color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  MODERATOR: { label: "Mod", color: "bg-brand-blue/10 text-brand-blue border-brand-blue/20" },
  MEMBER: {
    label: "Member",
    color: "bg-[var(--bg-subtle)] text-[var(--text-muted)] border-[var(--border-default)]",
  },
};

export default function GroupMembersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [membersCursor, setMembersCursor] = useState<string | undefined>(undefined);

  const { data: group, isLoading: groupLoading, isError } = useGetGroupQuery(id);
  const { data: membersData, isFetching: membersLoading } = useGetGroupMembersQuery({
    groupId: id,
    cursor: membersCursor,
  });
  const [updateMemberRole] = useUpdateMemberRoleMutation();
  const [removeMember] = useRemoveMemberMutation();

  const { data: joinRequests } = useGetJoinRequestsQuery(id, {
    skip: !group || (group.myRole !== "ADMIN" && group.myRole !== "MODERATOR"),
  });
  const { data: groupInvites } = useGetGroupInvitesQuery(id, {
    skip: !group || (group.myRole !== "ADMIN" && group.myRole !== "MODERATOR"),
  });
  const [approveJoinRequest] = useApproveJoinRequestMutation();
  const [rejectJoinRequest] = useRejectJoinRequestMutation();

  const members = membersData?.members || [];

  const handleLoadMore = () => {
    if (membersData?.nextCursor) setMembersCursor(membersData.nextCursor);
  };

  const handleRoleChange = async (userId: string, role: GroupRole) => {
    try {
      await updateMemberRole({ groupId: id, userId, role }).unwrap();
      toast.success("Role updated");
    } catch {
      toast.error("Failed to update role");
    }
  };

  const handleRemove = async (userId: string) => {
    try {
      await removeMember({ groupId: id, userId }).unwrap();
      toast.success("Member removed");
    } catch {
      toast.error("Failed to remove member");
    }
  };

  const handleApproveRequest = async (userId: string) => {
    try {
      await approveJoinRequest({ groupId: id, userId }).unwrap();
      toast.success("Request approved");
    } catch {
      toast.error("Failed to approve request");
    }
  };

  const handleRejectRequest = async (userId: string) => {
    try {
      await rejectJoinRequest({ groupId: id, userId }).unwrap();
      toast.success("Request rejected");
    } catch {
      toast.error("Failed to reject request");
    }
  };

  if (groupLoading) {
    return (
      <ProtectedRoute>
        <div className="mx-auto max-w-3xl space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </ProtectedRoute>
    );
  }

  if (isError || !group) {
    return (
      <ProtectedRoute>
        <div className="mx-auto max-w-3xl py-20 text-center">
          <p className="text-[var(--text-secondary)]">Group not found</p>
          <Link
            href="/groups"
            className="mt-4 inline-block text-sm text-brand-teal hover:underline"
          >
            Back to groups
          </Link>
        </div>
      </ProtectedRoute>
    );
  }

  const isMod = group.myRole === "ADMIN" || group.myRole === "MODERATOR";

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-3xl space-y-4 sm:space-y-6">
        <Link
          href={`/groups/${id}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to {group.name}
        </Link>

        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-teal to-brand-green shadow-[var(--shadow-glow-teal)]">
            <Shield className="size-5 text-white" />
          </div>
          <div>
            <h1 className="font-display text-xl font-extrabold tracking-tight">Members</h1>
            <p className="text-sm text-muted-foreground">
              {group.memberCount} {group.memberCount === 1 ? "member" : "members"}
            </p>
          </div>
        </div>

        {/* Join Requests */}
        {joinRequests && joinRequests.length > 0 && isMod && (
          <GlassCard variant="elevated" className="p-5">
            <h2 className="mb-4 font-display text-base font-bold">
              Join Requests ({joinRequests.length})
            </h2>
            <div className="space-y-3">
              {joinRequests.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-[var(--bg-overlay)]"
                >
                  <Link
                    href={`/${req.user.username}`}
                    className="flex min-w-0 flex-1 items-center gap-3"
                  >
                    <Avatar className="size-9">
                      {req.user.avatar ? (
                        <AvatarImage src={req.user.avatar} alt={req.user.name} />
                      ) : null}
                      <AvatarFallback className="bg-gradient-to-br from-brand-teal to-brand-green text-xs text-white">
                        {req.user.name?.charAt(0)?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{req.user.name}</p>
                      <p className="truncate text-xs text-muted-foreground">@{req.user.username}</p>
                    </div>
                  </Link>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="gradient"
                      onClick={() => handleApproveRequest(req.userId)}
                    >
                      <UserCheck className="size-4" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleRejectRequest(req.userId)}
                    >
                      <UserX className="size-4" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {/* Sent Invites */}
        {groupInvites && groupInvites.length > 0 && isMod && (
          <GlassCard variant="elevated" className="p-5">
            <h2 className="mb-4 font-display text-base font-bold">Sent Invites</h2>
            <div className="space-y-2">
              {groupInvites.map((inv) => (
                <div key={inv.id} className="flex items-center gap-2 text-sm">
                  <Avatar className="size-8">
                    {inv.user.avatar ? (
                      <AvatarImage src={inv.user.avatar} alt={inv.user.name} />
                    ) : null}
                    <AvatarFallback className="bg-gradient-to-br from-brand-teal to-brand-green text-xs text-white">
                      {inv.user.name?.charAt(0)?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="flex-1">{inv.user.name}</span>
                  <Badge variant="outline" className="text-[10px]">
                    {inv.status}
                  </Badge>
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {/* Members List */}
        <GlassCard variant="elevated" className="overflow-hidden">
          <div className="divide-y divide-[var(--border-subtle)]">
            {members.map((member) => {
              const roleStyle = ROLE_BADGE[member.role];
              return (
                <div
                  key={member.userId}
                  className="flex items-center gap-3 p-4 transition-colors hover:bg-[var(--bg-overlay)]"
                >
                  <Link href={`/${member.user.username}`}>
                    <Avatar className="size-10">
                      {member.user.avatar ? (
                        <AvatarImage src={member.user.avatar} alt={member.user.name} />
                      ) : null}
                      <AvatarFallback className="bg-gradient-to-br from-brand-teal to-brand-green text-sm text-white">
                        {member.user.name?.charAt(0)?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/${member.user.username}`}
                      className="text-sm font-semibold hover:underline"
                    >
                      {member.user.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">@{member.user.username}</p>
                  </div>

                  <Badge variant="outline" className={`text-[10px] ${roleStyle.color}`}>
                    {roleStyle.label}
                  </Badge>

                  {isMod && member.role !== "ADMIN" && (
                    <div className="flex items-center gap-1">
                      <select
                        value={member.role}
                        onChange={(e) =>
                          handleRoleChange(member.userId, e.target.value as GroupRole)
                        }
                        className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-subtle)] px-2 py-1 text-xs focus:border-brand-teal/50 focus:outline-none focus:ring-2 focus:ring-brand-teal/10"
                      >
                        <option value="MEMBER">Member</option>
                        <option value="MODERATOR">Moderator</option>
                      </select>
                      <button
                        onClick={() => handleRemove(member.userId)}
                        className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-400"
                        aria-label="Remove member"
                      >
                        <UserMinus className="size-4" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {members.length === 0 && !membersLoading && (
            <div className="py-12">
              <Empty>
                <EmptyMedia variant="gradient">
                  <Shield />
                </EmptyMedia>
                <EmptyTitle>No members yet</EmptyTitle>
                <EmptyDescription>Invite people to join this group.</EmptyDescription>
              </Empty>
            </div>
          )}

          {membersData?.hasMore && (
            <div className="border-t border-[var(--border-subtle)] p-4 text-center">
              <Button variant="ghost" size="sm" onClick={handleLoadMore} disabled={membersLoading}>
                {membersLoading ? "Loading..." : "Show more"}
              </Button>
            </div>
          )}
        </GlassCard>
      </div>
    </ProtectedRoute>
  );
}
