"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/shared/UserAvatar";
import {
  useGetFollowersQuery,
  useGetFollowingQuery,
  useFollowMutation,
  useUnfollowMutation,
} from "@/redux/api/userApi";
import { useAppSelector } from "@/hooks";
import Link from "next/link";
import { toast } from "sonner";
import { UserX } from "lucide-react";
import { useSound } from "@/hooks/useSound";

interface FollowersModalProps {
  userId: string;
  defaultTab?: "followers" | "following";
  open: boolean;
  onClose: () => void;
}

export function FollowersModal({
  userId,
  defaultTab = "followers",
  open,
  onClose,
}: FollowersModalProps) {
  const [tab, setTab] = useState<"followers" | "following">(defaultTab);
  const currentUser = useAppSelector((s) => s.auth.user);

  const { data: followersData, isLoading: followersLoading } = useGetFollowersQuery(
    { userId },
    { skip: !open || tab !== "followers" },
  );
  const { data: followingData, isLoading: followingLoading } = useGetFollowingQuery(
    { userId },
    { skip: !open || tab !== "following" },
  );

  const [follow] = useFollowMutation();
  const [unfollow] = useUnfollowMutation();
  const { play } = useSound();

  const followers = followersData?.data?.users || [];
  const following = followingData?.data?.users || [];
  const users = tab === "followers" ? followers : following;
  const isLoading = tab === "followers" ? followersLoading : followingLoading;

  const handleFollow = async (targetId: string, currentlyFollowing: boolean) => {
    try {
      if (currentlyFollowing) {
        await unfollow(targetId).unwrap();
      } else {
        await follow(targetId).unwrap();
        play("follow");
      }
    } catch {
      toast.error("Failed to update follow status");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">Connections</DialogTitle>
        </DialogHeader>
        <Tabs value={tab} onValueChange={(v) => setTab(v as "followers" | "following")}>
          <TabsList className="w-full">
            <TabsTrigger value="followers" className="flex-1">
              Followers
            </TabsTrigger>
            <TabsTrigger value="following" className="flex-1">
              Following
            </TabsTrigger>
          </TabsList>
          <TabsContent value={tab} className="mt-4 max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="flex flex-col gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-2xl p-2">
                    <Skeleton className="size-10 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : users.length > 0 ? (
              <div className="flex flex-col gap-1">
                {users.map(
                  (u: {
                    id: string;
                    name: string;
                    username: string;
                    avatar: string | null;
                    isVerified: boolean;
                    isFollowing?: boolean;
                  }) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between gap-2 rounded-2xl p-2 transition-colors hover:bg-[var(--bg-overlay)]"
                    >
                      <Link
                        href={`/${u.username}`}
                        className="flex min-w-0 flex-1 items-center gap-3"
                        onClick={onClose}
                      >
                        <UserAvatar
                          name={u.name}
                          avatar={u.avatar}
                          ring={u.isVerified ? "premium" : "default"}
                          size="default"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1">
                            <span className="truncate text-sm font-semibold">{u.name}</span>
                          </div>
                          <p className="truncate text-xs text-muted-foreground">@{u.username}</p>
                        </div>
                      </Link>
                      {currentUser && currentUser.id !== u.id && (
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => handleFollow(u.id, u.isFollowing || false)}
                        >
                          {u.isFollowing ? "Following" : "Follow"}
                        </Button>
                      )}
                    </div>
                  ),
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-[var(--bg-subtle)] text-muted-foreground">
                  <UserX className="size-6" />
                </div>
                <p className="text-sm text-muted-foreground">No {tab} yet.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
