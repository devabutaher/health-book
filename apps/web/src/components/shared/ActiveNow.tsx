"use client";

import { useSyncExternalStore, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { subscribeOnline, getOnlineSnapshot } from "@/lib/onlineStore";
import {
  useGetFollowingQuery,
  useGetFollowersQuery,
  useGetSuggestedQuery,
} from "@/redux/api/userApi";
import { useGetConversationsQuery, useCreateConversationMutation } from "@/redux/api/messagingApi";
import { useAppSelector } from "@/hooks";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { OnlineStatus } from "@/components/messaging/OnlineStatus";
import { Users } from "lucide-react";
import { toast } from "sonner";
import type { Conversation } from "@/types/conversation";

const EMPTY_ARRAY: string[] = [];

interface UserBrief {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
}

function normalizeUsers(raw: unknown): UserBrief[] {
  const list = (raw as { data?: { users?: unknown[] } } | undefined)?.data?.users ?? [];
  return list as UserBrief[];
}

function extractConversationPartners(
  conversations: Conversation[] | undefined,
  currentUserId: string,
): UserBrief[] {
  if (!conversations) return [];
  const seen = new Set<string>();
  const result: UserBrief[] = [];
  for (const conv of conversations) {
    if (conv.isGroup) continue;
    for (const p of conv.participants) {
      if (p.user.id !== currentUserId && !seen.has(p.user.id)) {
        seen.add(p.user.id);
        result.push(p.user);
      }
    }
  }
  return result;
}

const USER_LIMIT = 20;

function ActiveNowAvatars({ variant = "online" }: { variant?: "online" | "full" }) {
  const router = useRouter();
  const currentUserId = useAppSelector((s) => s.auth.user?.id);
  const onlineIds = useSyncExternalStore(subscribeOnline, getOnlineSnapshot, () => EMPTY_ARRAY);
  const [createConversation] = useCreateConversationMutation();

  const handleUserClick = useCallback(
    async (userId: string) => {
      try {
        const result = await createConversation({ participantIds: [userId] }).unwrap();
        router.push(`/messages/${result.id}`);
      } catch {
        toast.error("Failed to open conversation");
      }
    },
    [createConversation, router],
  );

  const isSkipped = !currentUserId;

  const { data: followingData, isLoading: followingLoading } = useGetFollowingQuery(
    { userId: currentUserId! },
    { skip: isSkipped },
  );
  const { data: followersData, isLoading: followersLoading } = useGetFollowersQuery(
    { userId: currentUserId! },
    { skip: isSkipped },
  );
  const { data: suggested, isLoading: suggestedLoading } = useGetSuggestedQuery(undefined, {
    skip: isSkipped,
  });
  const { data: conversationsData, isLoading: convsLoading } = useGetConversationsQuery(undefined, {
    skip: variant !== "full",
  });

  const following = useMemo(() => normalizeUsers(followingData), [followingData]);
  const followers = useMemo(() => normalizeUsers(followersData), [followersData]);
  const convPartners = useMemo(
    () =>
      currentUserId
        ? extractConversationPartners(conversationsData?.data ?? [], currentUserId)
        : [],
    [conversationsData, currentUserId],
  );
  const suggestedUsers = useMemo(() => (suggested ?? []) as UserBrief[], [suggested]);

  const isLoading = followingLoading || followersLoading || suggestedLoading || convsLoading;

  const displayUsers = useMemo(() => {
    if (!currentUserId) return [];

    if (variant === "online") {
      const seen = new Set<string>();
      const connected: UserBrief[] = [];
      for (const u of [...following, ...followers]) {
        if (!seen.has(u.id)) {
          seen.add(u.id);
          connected.push(u);
        }
      }
      const onlineConnected = connected.filter((u) => onlineIds.includes(u.id));
      let result = onlineConnected.slice(0, 6);
      if (result.length < 3) {
        const extra = suggestedUsers
          .filter((u) => !seen.has(u.id) && onlineIds.includes(u.id))
          .slice(0, 6 - result.length);
        result = [...result, ...extra];
      }
      return result;
    }

    // variant === "full" — show sequence: online > following > followers > conv-only
    const byId = new Map<string, { user: UserBrief; priority: number }>();

    function tryAdd(u: UserBrief, priority: number) {
      if (!byId.has(u.id)) {
        byId.set(u.id, { user: u, priority });
      }
    }

    for (const u of following) tryAdd(u, 1);
    for (const u of followers) tryAdd(u, 2);
    for (const u of convPartners) tryAdd(u, 3);

    // Promote online users (from any source) to priority 0
    for (const [id, entry] of byId) {
      if (onlineIds.includes(id)) {
        entry.priority = 0;
      }
    }

    // Add online suggested users not already in the set
    for (const u of suggestedUsers) {
      if (onlineIds.includes(u.id) && !byId.has(u.id)) {
        byId.set(u.id, { user: u, priority: 0 });
      }
    }

    const sorted = Array.from(byId.values())
      .sort((a, b) => a.priority - b.priority)
      .slice(0, USER_LIMIT)
      .map((e) => e.user);

    return sorted;
  }, [currentUserId, variant, following, followers, convPartners, suggestedUsers, onlineIds]);

  if (isLoading && displayUsers.length === 0) {
    return (
      <div className="flex items-center gap-3 overflow-x-auto px-4 py-3 scrollbar-none">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="size-10 shrink-0 rounded-full" />
        ))}
      </div>
    );
  }

  if (displayUsers.length === 0) {
    if (variant === "full") return null;
    return (
      <div className="flex flex-col items-center gap-2 px-3 py-4 text-center">
        <div className="flex size-10 items-center justify-center rounded-full bg-[var(--bg-overlay)]">
          <Users className="size-5 text-muted-foreground" />
        </div>
        <p className="text-xs text-muted-foreground">No active yet.</p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 overflow-x-auto scrollbar-none">
      <AnimatePresence initial={false}>
        {displayUsers.map((u) => {
          const isOnline = onlineIds.includes(u.id);
          return (
            <motion.div
              key={u.id}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
            >
              <button
                onClick={() => handleUserClick(u.id)}
                className="group relative flex shrink-0 flex-col items-center gap-1"
                title={`Message ${u.name}`}
              >
                <div className="relative">
                  {isOnline ? (
                    <div className="overflow-hidden rounded-full">
                      <div className="absolute inset-0 rounded-full bg-green-500/30 animate-pulse" />
                      <Avatar size="default" className="relative size-10 ring-2 ring-green-500">
                        {u.avatar ? <AvatarImage src={u.avatar} alt={u.name} /> : null}
                        <AvatarFallback className="bg-gradient-to-br from-brand-teal to-brand-green text-white text-xs font-semibold">
                          {u.name?.charAt(0)?.toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  ) : (
                    <Avatar size="default" className="size-10">
                      {u.avatar ? <AvatarImage src={u.avatar} alt={u.name} /> : null}
                      <AvatarFallback className="bg-gradient-to-br from-brand-teal to-brand-green text-white text-xs font-semibold">
                        {u.name?.charAt(0)?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  {variant === "full" && (
                    <OnlineStatus online={isOnline} className="absolute -bottom-0.5 -right-0.5" />
                  )}
                  {variant !== "full" && (
                    <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-[var(--bg-elevated)] bg-green-500" />
                  )}
                </div>
                <span className="max-w-14 truncate text-[10px] font-medium text-muted-foreground group-hover:text-foreground">
                  {u.name?.split(" ")[0]}
                </span>
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export function ActiveNow({ variant = "online" }: { variant?: "online" | "full" }) {
  if (variant === "full") {
    return (
      <div className="border-b border-[var(--border-default)]">
        <div className="px-4 py-3">
          <ActiveNowAvatars variant="full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between px-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
          Active Now
        </p>
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-green-500" />
        </span>
      </div>
      <ActiveNowAvatars variant="online" />
    </div>
  );
}
