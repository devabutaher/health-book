"use client";

import { useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { subscribeOnline, getOnlineSnapshot } from "@/lib/onlineStore";
import {
  useGetFollowingQuery,
  useGetFollowersQuery,
  useGetSuggestedQuery,
} from "@/redux/api/userApi";
import { useAppSelector } from "@/hooks";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Users } from "lucide-react";

const EMPTY_ARRAY: string[] = [];

function ActiveNowAvatars() {
  const router = useRouter();
  const currentUserId = useAppSelector((s) => s.auth.user?.id);
  const onlineIds = useSyncExternalStore(subscribeOnline, getOnlineSnapshot, () => EMPTY_ARRAY);

  const isSkipped = !currentUserId;
  const { data: followingData, isLoading: followingLoading } = useGetFollowingQuery(
    { userId: currentUserId! },
    { skip: isSkipped },
  );
  const { data: followersData, isLoading: followersLoading } = useGetFollowersQuery(
    { userId: currentUserId! },
    { skip: isSkipped },
  );
  const { data: suggested, isLoading: suggestedLoading } = useGetSuggestedQuery(undefined);

  const isLoading = followingLoading || followersLoading || suggestedLoading;

  const following = ((followingData as { data?: { users?: unknown[] } } | undefined)?.data?.users ??
    []) as { id: string; name: string; username: string; avatar?: string | null }[];
  const followers = ((followersData as { data?: { users?: unknown[] } } | undefined)?.data?.users ??
    []) as { id: string; name: string; username: string; avatar?: string | null }[];

  const seen = new Set<string>();
  const connected: typeof following = [];
  for (const u of [...following, ...followers]) {
    if (!seen.has(u.id)) {
      seen.add(u.id);
      connected.push(u);
    }
  }

  const onlineConnected = connected.filter((u) => onlineIds.includes(u.id));

  let displayUsers = onlineConnected.slice(0, 6);

  if (displayUsers.length < 3) {
    const suggestedUsers = (suggested ?? []) as {
      id: string;
      name: string;
      username: string;
      avatar?: string | null;
    }[];
    const extra = suggestedUsers
      .filter((u) => !seen.has(u.id) && onlineIds.includes(u.id))
      .slice(0, 6 - displayUsers.length);
    displayUsers = [...displayUsers, ...extra];
  }

  if (isLoading) {
    return (
      <div className="flex gap-2 px-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="size-10 shrink-0 rounded-full" />
        ))}
      </div>
    );
  }

  if (displayUsers.length === 0) {
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
    <div className="flex items-center gap-3 overflow-x-auto px-3 scrollbar-none">
      <AnimatePresence>
        {displayUsers.map((u) => (
          <motion.div
            key={u.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            <button
              onClick={() => router.push("/messages")}
              className="group relative flex shrink-0 flex-col items-center gap-1"
              title={`Message ${u.name}`}
            >
              <div className="relative">
                <div className="overflow-hidden rounded-full">
                  <div className="absolute inset-0 rounded-full bg-green-500/30 animate-pulse" />
                  <Avatar size="default" className="relative size-10 ring-2 ring-green-500">
                    {u.avatar ? <AvatarImage src={u.avatar} alt={u.name} /> : null}
                    <AvatarFallback className="bg-gradient-to-br from-brand-teal to-brand-green text-white text-xs font-semibold">
                      {u.name?.charAt(0)?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-[var(--bg-elevated)] bg-green-500" />
              </div>
              <span className="max-w-14 truncate text-[9px] font-medium text-muted-foreground group-hover:text-foreground">
                {u.name?.split(" ")[0]}
              </span>
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function ActiveNow() {
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
      <ActiveNowAvatars />
    </div>
  );
}
