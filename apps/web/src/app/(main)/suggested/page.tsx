"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Users } from "lucide-react";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { GlassCard } from "@/components/ui/glass-card";
import { useGetSuggestedQuery, useFollowMutation } from "@/redux/api/userApi";
import { toast } from "sonner";

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 24 },
  },
};

export default function SuggestedPage() {
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

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold">Suggested People</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Follow people to see their health journey in your feed
            </p>
          </div>
          <Link
            href="/feed"
            className="flex items-center gap-1.5 text-sm text-brand-teal hover:text-brand-green transition-colors"
          >
            <ArrowLeft className="size-4" />
            Back to Feed
          </Link>
        </div>

        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <GlassCard key={i} className="p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-12 shrink-0 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-8 w-20 shrink-0 rounded-full" />
                </div>
              </GlassCard>
            ))}
          </div>
        ) : users.length > 0 ? (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }}
            className="grid gap-3 sm:grid-cols-2"
          >
            {users.map((u) => (
              <motion.div key={u.id} variants={itemVariants}>
                <GlassCard className="p-4">
                  <div className="flex items-center gap-3">
                    <Link href={`/${u.username}`} className="shrink-0">
                      <UserAvatar
                        name={u.name}
                        avatar={u.avatar}
                        ring={u.isVerified ? "premium" : "default"}
                        size="default"
                      />
                    </Link>
                    <Link href={`/${u.username}`} className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold hover:underline">{u.name}</p>
                      <p className="truncate text-xs text-muted-foreground">@{u.username}</p>
                    </Link>
                    <Button
                      size="xs"
                      variant={followedIds.has(u.id) ? "outline" : "gradient"}
                      onClick={() => handleFollow(u.id)}
                      disabled={followedIds.has(u.id)}
                      className="shrink-0"
                    >
                      {followedIds.has(u.id) ? "Following" : "Follow"}
                    </Button>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <GlassCard className="p-10 text-center">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-[var(--bg-subtle)]">
              <Users className="size-7 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No suggestions right now.</p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              Check back later or explore trending topics to find people.
            </p>
          </GlassCard>
        )}
      </div>
    </ProtectedRoute>
  );
}
