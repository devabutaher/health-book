"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { GlassCard } from "@/components/ui/glass-card";

export function PostSkeleton() {
  return (
    <GlassCard variant="elevated" className="p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-2.5 w-16" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>
      <Skeleton className="mt-3 aspect-video w-full rounded-xl" />
      <div className="mt-3 flex gap-2 border-t border-[var(--border-subtle)] pt-3">
        <Skeleton className="h-8 w-20 rounded-xl" />
        <Skeleton className="h-8 w-20 rounded-xl" />
        <Skeleton className="h-8 w-20 rounded-xl" />
      </div>
    </GlassCard>
  );
}

export function PostSkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <PostSkeleton key={i} />
      ))}
    </div>
  );
}
