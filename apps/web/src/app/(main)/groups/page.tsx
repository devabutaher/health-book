"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Users, Search, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { motion } from "framer-motion";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { GroupCard } from "@/components/groups/GroupCard";
import { CreateGroupModal } from "@/components/groups/CreateGroupModal";
import {
  useBrowseGroupsQuery,
  useSearchGroupsQuery,
  useGetMyGroupsQuery,
  useGetMyInvitesQuery,
  useAcceptInviteMutation,
  useDeclineInviteMutation,
} from "@/redux/api/groupsApi";
import type { Group } from "@/types/group";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 24 },
  },
};

export default function GroupsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [browseCursor, setBrowseCursor] = useState<string | undefined>(undefined);
  const [searchCursor, setSearchCursor] = useState<string | undefined>(undefined);
  const [invitesOpen, setInvitesOpen] = useState(true);

  const { data, isLoading, isError, isFetching } = useBrowseGroupsQuery({ cursor: browseCursor });
  const { data: searchData, isFetching: isSearching } = useSearchGroupsQuery(
    { q: searchQuery, cursor: searchCursor },
    { skip: searchQuery.length < 2 },
  );
  const { data: myGroups } = useGetMyGroupsQuery();
  const { data: myInvites } = useGetMyInvitesQuery();
  const [acceptInvite] = useAcceptInviteMutation();
  const [declineInvite] = useDeclineInviteMutation();
  const [loadingInvites, setLoadingInvites] = useState(new Set<string>());

  const handleAcceptInvite = async (inviteId: string) => {
    setLoadingInvites((prev) => new Set(prev).add(inviteId));
    try {
      await acceptInvite(inviteId).unwrap();
    } catch {
      toast.error("Failed to accept invite");
    } finally {
      setLoadingInvites((prev) => {
        const next = new Set(prev);
        next.delete(inviteId);
        return next;
      });
    }
  };
  const handleDeclineInvite = async (inviteId: string) => {
    setLoadingInvites((prev) => new Set(prev).add(inviteId));
    try {
      await declineInvite(inviteId).unwrap();
    } catch {
      toast.error("Failed to decline invite");
    } finally {
      setLoadingInvites((prev) => {
        const next = new Set(prev);
        next.delete(inviteId);
        return next;
      });
    }
  };

  const handleLoadMore = () => {
    if (data?.nextCursor) setBrowseCursor(data.nextCursor);
  };
  const handleSearchLoadMore = () => {
    if (searchData?.nextCursor) setSearchCursor(searchData.nextCursor);
  };

  const renderGroupGrid = (groups: Group[]) => {
    if (!groups.length) return null;
    return (
      <motion.div
        className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {groups.map((g) => (
          <motion.div key={g.id} variants={itemVariants}>
            <GroupCard group={g} />
          </motion.div>
        ))}
      </motion.div>
    );
  };

  const renderLoading = () => (
    <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-2xl bg-[var(--bg-subtle)]">
          <div className="aspect-video rounded-t-2xl bg-[var(--bg-elevated)]" />
          <div className="space-y-3 p-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-[var(--bg-elevated)]" />
              <div className="h-4 flex-1 rounded-md bg-[var(--bg-elevated)]" />
            </div>
            <div className="h-3 w-3/4 rounded-md bg-[var(--bg-elevated)]" />
            <div className="flex gap-3">
              <div className="h-5 w-16 rounded-md bg-[var(--bg-elevated)]" />
              <div className="h-5 w-20 rounded-md bg-[var(--bg-elevated)]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-4xl">
        <div className="mb-4 sm:mb-6 flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">Groups</h1>
            <p className="text-sm text-[var(--text-secondary)]">Find your community</p>
          </div>
          <Button variant="gradient" onClick={() => setCreateOpen(true)}>
            <Plus />
            Create Group
          </Button>
        </div>

        <div className="relative mb-4 sm:mb-6">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--text-muted)]" />
          <Input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSearchCursor(undefined);
            }}
            placeholder="Search groups by name..."
            className="h-10 rounded-xl pl-10"
          />
        </div>

        {searchQuery.length >= 2 ? (
          <>
            {isSearching && !searchData ? (
              renderLoading()
            ) : searchData?.groups?.length ? (
              <>
                <p className="mb-3 text-xs text-[var(--text-muted)]">
                  Search results for &ldquo;{searchQuery}&rdquo;
                </p>
                {renderGroupGrid(searchData.groups)}
                {searchData.hasMore && (
                  <div className="mt-4 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSearchLoadMore}
                      disabled={isSearching}
                    >
                      {isSearching ? <Loader2 className="size-4 animate-spin" /> : "Show more"}
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <GlassCard variant="subtle" className="flex flex-col items-center py-20 text-center">
                <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
                  <Users className="size-8 text-blue-400" />
                </div>
                <h3 className="mb-1 text-lg font-semibold text-[var(--text-primary)]">
                  No groups found
                </h3>
                <p className="mb-6 max-w-sm text-sm text-[var(--text-secondary)]">
                  No groups match &ldquo;{searchQuery}&rdquo;
                </p>
              </GlassCard>
            )}
          </>
        ) : (
          <>
            {myInvites && myInvites.length > 0 && (
              <GlassCard variant="elevated" className="mb-6 sm:mb-8 overflow-hidden p-0">
                <button
                  onClick={() => setInvitesOpen((v) => !v)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left"
                >
                  <span className="text-sm font-bold text-[var(--text-primary)]">
                    Pending Invites ({myInvites.length})
                  </span>
                  {invitesOpen ? (
                    <ChevronUp className="size-4 text-[var(--text-muted)]" />
                  ) : (
                    <ChevronDown className="size-4 text-[var(--text-muted)]" />
                  )}
                </button>
                {invitesOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-2 border-t border-[var(--border-default)] px-4 pb-4 pt-3"
                  >
                    {myInvites.map((invite) => {
                      const initials = (invite.group?.name ?? "").slice(0, 2).toUpperCase();
                      return (
                        <div key={invite.id} className="flex items-center justify-between gap-3">
                          <Link
                            href={`/groups/${invite.groupId}`}
                            className="flex items-center gap-3 min-w-0 flex-1"
                          >
                            <Avatar size="sm" className="size-9 shrink-0">
                              {invite.group?.avatar ? (
                                <AvatarImage src={invite.group.avatar} />
                              ) : null}
                              <AvatarFallback className="bg-gradient-to-br from-brand-teal to-brand-green text-xs text-white">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                                {invite.group?.name}
                              </p>
                              <p className="truncate text-xs text-[var(--text-muted)]">
                                Invited by {invite.inviter.name}
                              </p>
                            </div>
                          </Link>
                          <div className="flex shrink-0 gap-2">
                            <Button
                              size="sm"
                              variant="gradient"
                              disabled={loadingInvites.has(invite.id)}
                              onClick={() => handleAcceptInvite(invite.id)}
                              className="h-8 rounded-lg text-[11px]"
                            >
                              {loadingInvites.has(invite.id) ? (
                                <Loader2 className="size-3 animate-spin" />
                              ) : (
                                "Accept"
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={loadingInvites.has(invite.id)}
                              onClick={() => handleDeclineInvite(invite.id)}
                              className="h-8 rounded-lg text-[11px]"
                            >
                              {loadingInvites.has(invite.id) ? (
                                <Loader2 className="size-3 animate-spin" />
                              ) : (
                                "Decline"
                              )}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </GlassCard>
            )}

            {myGroups && myGroups.length > 0 && (
              <div className="mb-6 sm:mb-8">
                <div className="mb-3 flex items-center gap-3">
                  <h2 className="font-display text-base font-bold text-[var(--text-primary)]">
                    My Groups
                  </h2>
                  <div className="h-px flex-1 bg-[var(--border-default)]" />
                </div>
                {renderGroupGrid(myGroups)}
              </div>
            )}

            <div className="mb-3 flex items-center gap-3">
              <h2 className="font-display text-base font-bold text-[var(--text-primary)]">
                Discover
              </h2>
              <div className="h-px flex-1 bg-[var(--border-default)]" />
            </div>

            {isLoading ? (
              renderLoading()
            ) : isError ? (
              <GlassCard variant="subtle" className="flex flex-col items-center py-20 text-center">
                <h3 className="mb-1 text-lg font-semibold text-[var(--text-primary)]">
                  Something went wrong
                </h3>
                <p className="mb-6 max-w-sm text-sm text-[var(--text-secondary)]">
                  Failed to load groups. Please try again.
                </p>
                <Button variant="secondary" onClick={() => window.location.reload()}>
                  Retry
                </Button>
              </GlassCard>
            ) : !data?.groups?.length ? (
              <div className="flex flex-col items-center py-20 text-center">
                <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
                  <Users className="size-8 text-blue-400" />
                </div>
                <h3 className="mb-1 text-lg font-semibold text-[var(--text-primary)]">
                  No groups yet
                </h3>
                <p className="mb-6 max-w-sm text-sm text-[var(--text-secondary)]">
                  Create the first group or discover public communities
                </p>
                <Button variant="gradient" onClick={() => setCreateOpen(true)}>
                  <Plus />
                  Create Group
                </Button>
              </div>
            ) : (
              <>
                {renderGroupGrid(data.groups)}
                {data.hasMore && (
                  <div className="mt-4 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLoadMore}
                      disabled={isFetching}
                    >
                      {isFetching ? <Loader2 className="size-4 animate-spin" /> : "Show more"}
                    </Button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        <CreateGroupModal open={createOpen} onClose={() => setCreateOpen(false)} />
      </div>
    </ProtectedRoute>
  );
}
