"use client";

import { useState } from "react";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useFollowMutation, useGetSuggestedQuery } from "@/redux/api/userApi";
import Link from "next/link";
import { toast } from "sonner";

export function SuggestedSection() {
  const { data, isLoading } = useGetSuggestedQuery(undefined);
  const [follow] = useFollowMutation();
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());
  const users = data || [];

  const handleFollow = async (userId: string) => {
    setFollowedIds((prev) => new Set(prev).add(userId));
    try {
      await follow(userId).unwrap();
    } catch {
      setFollowedIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
      toast.error("Failed to follow user");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 px-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="size-8 rounded-full" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-2 w-14" />
            </div>
            <Skeleton className="h-6 w-14 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 px-3 py-4 text-center">
        <p className="text-xs text-muted-foreground">No suggested yet.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 px-3">
      {users.slice(0, 6).map((u) => (
        <div key={u.id} className="flex items-center gap-3 rounded-xl px-2 py-1.5">
          <Link href={`/${u.username}`} prefetch={false} className="shrink-0">
            <UserAvatar
              name={u.name}
              avatar={u.avatar}
              ring={u.isVerified ? "premium" : "default"}
              size="sm"
            />
          </Link>
          <Link href={`/${u.username}`} prefetch={false} className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium hover:underline">{u.name}</p>
            <p className="truncate text-[10px] text-muted-foreground">@{u.username}</p>
          </Link>
          <Button
            size="xs"
            variant={followedIds.has(u.id) ? "outline" : "gradient"}
            onClick={() => handleFollow(u.id)}
            disabled={followedIds.has(u.id)}
            className="shrink-0 h-7 text-[10px] px-2.5"
          >
            {followedIds.has(u.id) ? "Following" : "Follow"}
          </Button>
        </div>
      ))}
      <Link
        href="/suggested"
        prefetch={false}
        className="mt-1 text-center text-[10px] font-medium text-brand-teal transition-colors hover:text-brand-green"
      >
        View all
      </Link>
    </div>
  );
}
