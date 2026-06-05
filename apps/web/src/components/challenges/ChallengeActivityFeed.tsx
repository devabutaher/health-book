"use client";

import { useState, useCallback } from "react";
import { formatRelativeTime } from "@/lib/utils";
import { Activity, ChevronDown } from "lucide-react";
import { useGetActivityFeedQuery } from "@/redux/api/challengesApi";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import type { ChallengeActivity } from "@/types/challenge";

const activityIcons: Record<string, string> = {
  JOIN: "👋",
  CHECK_IN: "✅",
  MILESTONE: "🏆",
  COMPLETE: "🎉",
  COMMENT: "💬",
};

export function ChallengeActivityFeed({ challengeId }: { challengeId: string }) {
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const { data, isLoading, isFetching } = useGetActivityFeedQuery({ challengeId, cursor });

  const activities = data?.activities || [];
  const loadingMore = isFetching && !!cursor;

  const loadMore = useCallback(() => {
    if (!data?.hasMore || isFetching) return;
    setCursor(data.nextCursor || undefined);
  }, [data, isFetching]);

  return (
    <GlassCard variant="elevated" className="p-4 sm:p-5">
      <h2 className="mb-4 flex items-center gap-2 font-display text-base font-bold text-[var(--text-primary)]">
        <Activity className="size-4 text-brand-teal" />
        Activity
      </h2>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-[var(--bg-subtle)]" />
          ))}
        </div>
      ) : !activities.length ? (
        <p className="py-6 text-center text-xs text-[var(--text-muted)]">
          No activity yet. Join and start checking in!
        </p>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {activities.map((a: ChallengeActivity) => (
            <div
              key={a.id}
              className="flex items-start gap-3 rounded-xl p-2 transition-colors hover:bg-[var(--bg-overlay)]"
            >
              <Avatar size="sm" className="size-7 shrink-0">
                {a.user.avatar ? <AvatarImage src={a.user.avatar} /> : null}
                <AvatarFallback className="text-[10px]">{a.user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-[var(--text-primary)]">
                  <span className="font-semibold">{a.user.name}</span>{" "}
                  <span className="text-[var(--text-secondary)]">{a.message}</span>
                </p>
                <p className="text-[10px] text-[var(--text-muted)]">
                  {formatRelativeTime(a.createdAt)}
                </p>
              </div>
              <span className="text-sm">{activityIcons[a.type] || "📌"}</span>
            </div>
          ))}
        </div>
      )}

      {data?.hasMore && (
        <Button
          variant="secondary"
          size="sm"
          onClick={loadMore}
          disabled={loadingMore}
          className="mt-3 w-full"
        >
          <ChevronDown className="size-3.5" />
          {loadingMore ? "Loading..." : "Load More"}
        </Button>
      )}
    </GlassCard>
  );
}
