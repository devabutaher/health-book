"use client";

import { use, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Users, X, Lock, Camera, Calendar, Globe, ImagePlus, Plus } from "lucide-react";
import { GroupHeader } from "@/components/groups/GroupHeader";
import { GroupMembersList } from "@/components/groups/GroupMembersList";
import { GroupEventsSection } from "@/components/groups/GroupEventsSection";
import { GroupPollsSection } from "@/components/groups/GroupPollsSection";
import { InviteMemberModal } from "@/components/groups/InviteMemberModal";
import { GroupTabs, type GroupTab } from "@/components/groups/GroupTabs";
import {
  useGetGroupQuery,
  useGetGroupMembersQuery,
  useJoinGroupMutation,
  useLeaveGroupMutation,
  useUpdateGroupMutation,
  useDeleteGroupMutation,
  useUpdateMemberRoleMutation,
  useRemoveMemberMutation,
  useRequestJoinGroupMutation,
  useGetJoinRequestsQuery,
  useApproveJoinRequestMutation,
  useRejectJoinRequestMutation,
  useGetGroupInvitesQuery,
  useUploadGroupMediaMutation,
} from "@/redux/api/groupsApi";
import { useGetGroupFeedQuery } from "@/redux/api/postApi";
import { PostCard } from "@/components/post/PostCard";
import dynamic from "next/dynamic";
const CreatePostModal = dynamic(
  () => import("@/components/post/CreatePostModal").then((m) => ({ default: m.CreatePostModal })),
  { ssr: false },
);
import { useBrowseChallengesQuery } from "@/redux/api/challengesApi";
import { useGroupRealtime } from "@/hooks/useGroupRealtime";
import { ChallengeCard } from "@/components/challenges/ChallengeCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { GlassCard } from "@/components/ui/glass-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { GroupRole } from "@/types/group";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/getErrorMessage";
import Link from "next/link";
import { useSound } from "@/hooks/useSound";

const tabContentVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 24 },
  },
};

export default function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  useGroupRealtime(id);
  const [activeTab, setActiveTab] = useState<GroupTab>("feed");
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editType, setEditType] = useState<"PUBLIC" | "PRIVATE" | "SECRET">("PUBLIC");
  const [editAvatarUrl, setEditAvatarUrl] = useState("");
  const [editCoverUrl, setEditCoverUrl] = useState("");
  const [membersCursor, setMembersCursor] = useState<string | undefined>(undefined);
  const [feedCursor, setFeedCursor] = useState<string | undefined>(undefined);
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [challengeCursor, setChallengeCursor] = useState<string | undefined>(undefined);

  const { data: group, isLoading, isError } = useGetGroupQuery(id);
  const [joinGroup, { isLoading: isJoining }] = useJoinGroupMutation();
  const [leaveGroup, { isLoading: isLeaving }] = useLeaveGroupMutation();
  const [updateGroup, { isLoading: isUpdating }] = useUpdateGroupMutation();
  const [uploadMedia, { isLoading: uploadingMedia }] = useUploadGroupMediaMutation();
  const isEditingMedia = uploadingMedia || isUpdating;
  const editAvatarRef = useRef<HTMLInputElement>(null);
  const editCoverRef = useRef<HTMLInputElement>(null);
  const [deleteGroup, { isLoading: isDeleting }] = useDeleteGroupMutation();
  const [updateMemberRole] = useUpdateMemberRoleMutation();
  const [removeMember] = useRemoveMemberMutation();
  const [requestJoinGroup, { isLoading: isRequestingJoin }] = useRequestJoinGroupMutation();

  const { data: membersData, isFetching: membersLoading } = useGetGroupMembersQuery({
    groupId: id,
    cursor: membersCursor,
  });
  const { data: feedData, isFetching: feedLoading } = useGetGroupFeedQuery(
    { groupId: id, cursor: feedCursor },
    { skip: !group?.isMember },
  );
  const { data: joinRequests } = useGetJoinRequestsQuery(id, {
    skip: !group || (group.myRole !== "ADMIN" && group.myRole !== "MODERATOR"),
  });
  const { data: groupInvites } = useGetGroupInvitesQuery(id, {
    skip: !group || (group.myRole !== "ADMIN" && group.myRole !== "MODERATOR"),
  });
  const { data: groupChallenges, isFetching: challengesLoading } = useBrowseChallengesQuery(
    { groupId: id, cursor: challengeCursor },
    { skip: !group?.isMember },
  );

  const [approveJoinRequest] = useApproveJoinRequestMutation();
  const [rejectJoinRequest] = useRejectJoinRequestMutation();
  const { play } = useSound();

  const members = membersData?.members || [];
  const isAdmin = group?.myRole === "ADMIN" || group?.myRole === "MODERATOR";

  const handleLoadMoreMembers = () => {
    if (membersData?.nextCursor) setMembersCursor(membersData.nextCursor);
  };

  const handleLoadMoreFeed = () => {
    if (feedData?.nextCursor) setFeedCursor(feedData.nextCursor);
  };

  const handleJoin = async () => {
    play("success");
    try {
      await joinGroup(id).unwrap();
      toast.success("Joined group!");
    } catch (err) {
      play("error");
      toast.error(getErrorMessage(err, "Failed to join group"));
    }
  };

  const handleRequestJoin = async () => {
    play("success");
    try {
      await requestJoinGroup(id).unwrap();
      toast.success("Join request sent!");
    } catch (err) {
      play("error");
      toast.error(getErrorMessage(err, "Failed to send join request"));
    }
  };

  const handleLeave = async () => {
    play("success");
    try {
      await leaveGroup(id).unwrap();
      toast.success("Left group");
      setLeaveOpen(false);
    } catch (err) {
      play("error");
      toast.error(getErrorMessage(err, "Failed to leave group"));
    }
  };

  const handleDelete = async () => {
    try {
      await deleteGroup(id).unwrap();
      toast.success("Group deleted");
      setDeleteOpen(false);
      router.push("/groups");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to delete group"));
    }
  };

  const handleEditMedia = async (file: File, target: "avatar" | "cover") => {
    const fd = new FormData();
    fd.append("image", file);
    try {
      const { url } = await uploadMedia(fd).unwrap();
      if (target === "avatar") setEditAvatarUrl(url);
      else setEditCoverUrl(url);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to upload image"));
    }
  };

  const handleEdit = () => {
    if (!group) return;
    setEditName(group.name);
    setEditDescription(group.description || "");
    setEditType(group.type);
    setEditAvatarUrl("");
    setEditCoverUrl("");
    setEditing(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;
    try {
      await updateGroup({
        id,
        name: editName.trim(),
        description: editDescription.trim() || undefined,
        type: editType,
        ...(editAvatarUrl ? { avatar: editAvatarUrl } : {}),
        ...(editCoverUrl ? { coverPhoto: editCoverUrl } : {}),
      }).unwrap();
      toast.success("Group updated");
      setEditing(false);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to update group"));
    }
  };

  const handleRoleChange = async (userId: string, role: GroupRole) => {
    try {
      await updateMemberRole({ groupId: id, userId, role }).unwrap();
      toast.success("Role updated");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to update role"));
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      await removeMember({ groupId: id, userId }).unwrap();
      toast.success("Member removed");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to remove member"));
    }
  };

  const handleApproveRequest = async (userId: string) => {
    try {
      await approveJoinRequest({ groupId: id, userId }).unwrap();
      toast.success("Request approved");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to approve request"));
    }
  };

  const handleRejectRequest = async (userId: string) => {
    try {
      await rejectJoinRequest({ groupId: id, userId }).unwrap();
      toast.success("Request rejected");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to reject request"));
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-10 rounded-xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (isError || !group) {
    return (
      <div className="flex flex-col items-center py-20 text-center">
        <p className="text-[var(--text-secondary)]">Group not found</p>
        <Link
          href="/groups"
          prefetch={false}
          className="mt-4 text-sm text-brand-teal hover:underline"
        >
          Back to groups
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Full-width cover */}
      <div className="relative h-40 w-full overflow-hidden bg-[var(--bg-subtle)] md:h-56">
        {group.coverPhoto ? (
          <div
            className="size-full bg-cover bg-center"
            style={{ backgroundImage: `url(${group.coverPhoto})` }}
          />
        ) : (
          <div className="size-full bg-gradient-to-r from-brand-teal/20 via-brand-blue/20 to-brand-green/20" />
        )}
      </div>

      <div className="relative -mt-16 z-10 mx-auto max-w-4xl space-y-4 sm:space-y-6">
      <GroupHeader
        group={group}
        isMember={group.isMember}
        onJoin={handleJoin}
        onLeave={() => setLeaveOpen(true)}
        onEdit={group.myRole === "ADMIN" ? handleEdit : undefined}
        onDelete={group.myRole === "ADMIN" ? () => setDeleteOpen(true) : undefined}
      />

      {editing && (
        <GlassCard variant="elevated" className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-[var(--text-primary)]">
              Edit Group
            </h2>
            <button
              onClick={() => setEditing(false)}
              className="flex size-8 items-center justify-center rounded-xl text-[var(--text-muted)] hover:bg-[var(--bg-overlay)]"
            >
              <X className="size-4" />
            </button>
          </div>
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col items-center gap-2 self-start">
                <div
                  className="relative size-20 cursor-pointer overflow-hidden rounded-full border-2 border-dashed border-[var(--border-default)]"
                  onClick={() => editAvatarRef.current?.click()}
                >
                  {editAvatarUrl ? (
                    <Image src={editAvatarUrl} alt="Avatar" fill className="object-cover" />
                  ) : group?.avatar ? (
                    <Image src={group.avatar} alt="Avatar" fill className="object-cover" />
                  ) : (
                    <div className="flex size-full items-center justify-center text-[var(--text-muted)]">
                      <Camera className="size-6" />
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-[var(--text-muted)]">Avatar</span>
                <input
                  ref={editAvatarRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleEditMedia(f, "avatar");
                  }}
                />
              </div>
              <div className="flex flex-col items-center gap-2">
                <div
                  className="relative w-full aspect-video cursor-pointer overflow-hidden rounded-xl border-2 border-dashed border-[var(--border-default)]"
                  onClick={() => editCoverRef.current?.click()}
                >
                  {editCoverUrl ? (
                    <Image src={editCoverUrl} alt="Cover" fill className="object-cover" />
                  ) : group?.coverPhoto ? (
                    <Image src={group.coverPhoto} alt="Cover" fill className="object-cover" />
                  ) : (
                    <div className="flex size-full items-center justify-center text-[var(--text-muted)]">
                      <ImagePlus className="size-5" />
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-[var(--text-muted)]">Cover</span>
                <input
                  ref={editCoverRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleEditMedia(f, "cover");
                  }}
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">
                Group Name
              </label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                maxLength={100}
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">
                Description
              </label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
                maxLength={2000}
                className="w-full resize-none rounded-xl border border-[var(--border-default)] bg-[var(--bg-subtle)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-brand-teal/50 focus:outline-none focus:ring-2 focus:ring-brand-teal/10"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">
                Privacy
              </label>
              <div className="flex gap-2">
                {(["PUBLIC", "PRIVATE", "SECRET"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setEditType(t)}
                    className={`flex-1 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${editType === t ? "bg-gradient-to-r from-brand-teal to-brand-green text-white" : "bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-overlay)]"}`}
                  >
                    {t === "PUBLIC" ? "Public" : t === "PRIVATE" ? "Private" : "Secret"}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setEditing(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="gradient"
                disabled={!editName.trim() || isEditingMedia}
                className="flex-1"
              >
                {isEditingMedia ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </GlassCard>
      )}

      {group.isMember ? (
        <>
          <GroupTabs active={activeTab} onChange={setActiveTab} isMember={group.isMember} />

          <AnimatePresence mode="wait">
            {activeTab === "feed" && (
              <motion.div
                key="feed"
                variants={tabContentVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="space-y-3 sm:space-y-4"
              >
                {/* Admin quick actions */}
                {isAdmin && (
                  <div className="flex flex-wrap gap-2">
                    {joinRequests && joinRequests.length > 0 && (
                      <GlassCard variant="elevated" className="w-full p-4">
                        <h3 className="mb-3 text-sm font-bold text-[var(--text-primary)]">
                          Join Requests ({joinRequests.length})
                        </h3>
                        <div className="space-y-2">
                          {joinRequests.map((req) => (
                            <div
                              key={req.id}
                              className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-[var(--bg-overlay)]"
                            >
                              <Link
                                href={`/${req.user.username}`}
                                prefetch={false}
                                className="flex min-w-0 flex-1 items-center gap-3"
                              >
                                <Avatar className="size-8">
                                  {req.user.avatar ? (
                                    <AvatarImage src={req.user.avatar} alt={req.user.name} />
                                  ) : null}
                                  <AvatarFallback className="bg-gradient-to-br from-brand-teal to-brand-green text-xs text-white">
                                    {req.user.name?.charAt(0)?.toUpperCase() || "?"}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                                    {req.user.name}
                                  </p>
                                  <p className="truncate text-xs text-[var(--text-muted)]">
                                    @{req.user.username}
                                  </p>
                                </div>
                              </Link>
                              <div className="flex gap-1.5">
                                <Button
                                  size="sm"
                                  variant="gradient"
                                  className="h-7 text-[10px]"
                                  onClick={() => handleApproveRequest(req.userId)}
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="h-7 text-[10px]"
                                  onClick={() => handleRejectRequest(req.userId)}
                                >
                                  Reject
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </GlassCard>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setInviteOpen(true)}
                      className="rounded-lg text-xs"
                    >
                      <Plus className="size-3.5" /> Invite Members
                    </Button>

                    {groupInvites && groupInvites.length > 0 && (
                      <span className="text-xs text-[var(--text-muted)] self-center">
                        {groupInvites.length} pending invite{groupInvites.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <h2 className="font-display text-base font-bold text-[var(--text-primary)]">
                    Group Feed
                  </h2>
                  <Button size="sm" variant="gradient" onClick={() => setCreatePostOpen(true)}>
                    <Plus className="size-4" />
                    Create Post
                  </Button>
                </div>

                {feedLoading && !feedData ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-48 rounded-2xl" />
                    ))}
                  </div>
                ) : !feedData?.posts?.length ? (
                  <GlassCard
                    variant="subtle"
                    className="flex flex-col items-center py-16 text-center"
                  >
                    <p className="text-sm text-[var(--text-muted)]">
                      No posts in this group yet. Be the first to share!
                    </p>
                  </GlassCard>
                ) : (
                  <>
                    <div className="space-y-4">
                      {feedData.posts.map((post) => (
                        <PostCard key={post.id} post={post} />
                      ))}
                    </div>
                    {feedData.hasMore && (
                      <div className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleLoadMoreFeed}
                          disabled={feedLoading}
                        >
                          {feedLoading ? "Loading..." : "Show more posts"}
                        </Button>
                      </div>
                    )}
                  </>
                )}

                <CreatePostModal
                  open={createPostOpen}
                  onClose={() => setCreatePostOpen(false)}
                  onCreated={() => setFeedCursor(undefined)}
                  groupId={id}
                />
              </motion.div>
            )}

            {activeTab === "events" && (
              <motion.div
                key="events"
                variants={tabContentVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
              >
                <GroupEventsSection groupId={id} canManage={isAdmin} />
              </motion.div>
            )}

            {activeTab === "polls" && (
              <motion.div
                key="polls"
                variants={tabContentVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
              >
                <GroupPollsSection groupId={id} canManage={isAdmin} />
              </motion.div>
            )}

            {activeTab === "challenges" && (
              <motion.div
                key="challenges"
                variants={tabContentVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
              >
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-base font-bold text-[var(--text-primary)]">
                    Group Challenges
                  </h2>
                  <Button size="sm" variant="gradient" onClick={() => router.push("/challenges")}>
                    Create Challenge
                  </Button>
                </div>

                {challengesLoading ? (
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <Skeleton key={i} className="h-44 rounded-2xl" />
                    ))}
                  </div>
                ) : !groupChallenges?.challenges?.length ? (
                  <GlassCard
                    variant="subtle"
                    className="mt-4 flex flex-col items-center py-16 text-center"
                  >
                    <p className="text-sm text-[var(--text-muted)]">
                      No challenges in this group yet.
                    </p>
                  </GlassCard>
                ) : (
                  <>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      {groupChallenges.challenges.map((c) => (
                        <ChallengeCard key={c.id} challenge={c} />
                      ))}
                    </div>
                    {groupChallenges.hasMore && (
                      <div className="mt-4 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setChallengeCursor(groupChallenges.nextCursor!)}
                          disabled={challengesLoading}
                        >
                          {challengesLoading ? "Loading..." : "Show more"}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            )}

            {activeTab === "members" && (
              <motion.div
                key="members"
                variants={tabContentVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
              >
                <GroupMembersList
                  members={members}
                  totalCount={group.memberCount}
                  currentUserRole={group.myRole}
                  hasMore={membersData?.hasMore}
                  onLoadMore={handleLoadMoreMembers}
                  onRoleChange={handleRoleChange}
                  onRemove={handleRemoveMember}
                  loading={membersLoading}
                />
              </motion.div>
            )}

            {activeTab === "about" && (
              <motion.div
                key="about"
                variants={tabContentVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
              >
                <GlassCard variant="elevated" className="divide-y divide-[var(--border-default)]">
                  <div className="p-5">
                    <h3 className="mb-3 font-display text-base font-bold text-[var(--text-primary)]">
                      About
                    </h3>
                    <p className="whitespace-pre-wrap text-sm text-[var(--text-secondary)]">
                      {group.description || "No description provided."}
                    </p>
                  </div>
                  <div className="space-y-4 p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-brand-teal/10">
                        {group.type === "PUBLIC" ? (
                          <Globe className="size-5 text-brand-teal" />
                        ) : group.type === "PRIVATE" ? (
                          <Lock className="size-5 text-brand-teal" />
                        ) : (
                          <Shield className="size-5 text-brand-teal" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--text-primary)]">
                          {group.type === "PUBLIC"
                            ? "Public Group"
                            : group.type === "PRIVATE"
                              ? "Private Group"
                              : "Secret Group"}
                        </p>
                        <p className="text-xs text-[var(--text-muted)]">
                          {group.type === "PUBLIC"
                            ? "Anyone can join"
                            : group.type === "PRIVATE"
                              ? "Request to join"
                              : "Invite only"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-brand-blue/10">
                        <Users className="size-5 text-brand-blue" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--text-primary)]">
                          {group.memberCount} member{group.memberCount !== 1 ? "s" : ""}
                        </p>
                        <p className="text-xs text-[var(--text-muted)]">People in this group</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-purple-500/10">
                        <Calendar className="size-5 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--text-primary)]">
                          Created{" "}
                          {new Date(group.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                        <p className="text-xs text-[var(--text-muted)]">Group creation date</p>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>

          <InviteMemberModal open={inviteOpen} onClose={() => setInviteOpen(false)} groupId={id} />
        </>
      ) : (
        <GlassCard variant="elevated" className="p-6 text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-brand-teal/20 to-brand-green/20">
            <Users className="size-8 text-brand-teal" />
          </div>
          <h3 className="mb-2 text-lg font-bold text-[var(--text-primary)]">
            You&apos;re not a member yet
          </h3>
          <p className="mb-6 text-sm text-[var(--text-secondary)]">
            {group.type === "PRIVATE"
              ? "This is a private group. Send a join request to become a member."
              : group.type === "SECRET"
                ? "This is a secret group. You need an invite to join."
                : "Join this group to see posts and connect with members."}
          </p>
          {group.type === "PRIVATE" ? (
            <Button variant="gradient" onClick={handleRequestJoin} disabled={isRequestingJoin}>
              {isRequestingJoin ? "Sending request..." : "Request to Join"}
            </Button>
          ) : group.type === "PUBLIC" ? (
            <Button variant="gradient" onClick={handleJoin} disabled={isJoining}>
              {isJoining ? "Joining..." : "Join Group"}
            </Button>
          ) : null}
        </GlassCard>
      )}

      <AlertDialog open={leaveOpen} onOpenChange={setLeaveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave this group?</AlertDialogTitle>
            <AlertDialogDescription>
              You&apos;ll need to be re-invited to rejoin if this is a private or secret group.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLeave} disabled={isLeaving}>
              {isLeaving ? "Leaving..." : "Leave Group"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this group?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All group data will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? "Deleting..." : "Delete Group"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </>
  );
}
