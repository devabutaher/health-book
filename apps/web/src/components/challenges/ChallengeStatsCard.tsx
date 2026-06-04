"use client";

import { Trophy, Target, Flame, Activity, CheckCircle, BarChart3 } from "lucide-react";
import { useGetUserChallengeStatsQuery } from "@/redux/api/challengesApi";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";

export function ChallengeStatsCard({ userId }: { userId?: string }) {
  const { data: stats, isLoading } = useGetUserChallengeStatsQuery(userId);

  if (isLoading) {
    return (
      <GlassCard variant="elevated" className="p-5">
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 animate-pulse rounded-xl bg-[var(--bg-subtle)]" />
          ))}
        </div>
      </GlassCard>
    );
  }

  if (!stats) return null;

  const items = [
    {
      label: "Joined",
      value: stats.totalJoined,
      icon: Target,
      color: "text-brand-blue",
      bg: "bg-brand-blue/10",
    },
    {
      label: "Completed",
      value: stats.totalCompleted,
      icon: Trophy,
      color: "text-brand-teal",
      bg: "bg-brand-teal/10",
    },
    {
      label: "Rate",
      value: `${stats.completionRate}%`,
      icon: BarChart3,
      color: "text-brand-amber",
      bg: "bg-brand-amber/10",
    },
    {
      label: "Check-ins",
      value: stats.totalCheckIns,
      icon: CheckCircle,
      color: "text-brand-green",
      bg: "bg-brand-green/10",
    },
    {
      label: "Best Streak",
      value: stats.bestStreak,
      icon: Flame,
      color: "text-brand-coral",
      bg: "bg-brand-coral/10",
    },
    {
      label: "Categories",
      value: Object.keys(stats.challengesByCategory).length,
      icon: Activity,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
  ];

  return (
    <GlassCard variant="elevated" className="p-5">
      <h3 className="mb-4 font-display text-sm font-bold text-[var(--text-primary)]">
        <Trophy className="mr-1.5 inline size-4 text-brand-amber" />
        Challenge Stats
      </h3>
      <div className="grid grid-cols-3 gap-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-xl bg-[var(--bg-subtle)] p-3 text-center">
              <div
                className={cn(
                  "mx-auto mb-1 flex size-8 items-center justify-center rounded-lg",
                  item.bg,
                )}
              >
                <Icon className={cn("size-4", item.color)} />
              </div>
              <p className="text-base font-bold text-[var(--text-primary)]">{item.value}</p>
              <p className="text-[10px] text-[var(--text-muted)]">{item.label}</p>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}
