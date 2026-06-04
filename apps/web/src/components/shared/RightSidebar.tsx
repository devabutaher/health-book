"use client";

import { useState } from "react";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CURATED_TAGS } from "@/lib/constants";
import { useBrowseChallengesQuery } from "@/redux/api/challengesApi";
import { useGetHealthStatsQuery } from "@/redux/api/healthLogApi";
import { useFollowMutation, useGetSuggestedQuery } from "@/redux/api/userApi";
import { Activity, ArrowRight, Flame, Heart, Trophy, Users } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { ActiveNow } from "./ActiveNow";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-3 pb-1 pt-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
      {children}
    </p>
  );
}

function Divider() {
  return (
    <div className="mx-3 my-2 h-px bg-gradient-to-r from-transparent via-[var(--border-default)] to-transparent" />
  );
}

function StatsSection() {
  const { data, isLoading } = useGetHealthStatsQuery(undefined);
  const stats = data?.data as
    | { streak?: number; healthScore?: number; totalLogs?: number }
    | undefined;

  const items = [
    {
      label: "Streak",
      value: stats?.streak ?? 0,
      icon: Flame,
      gradient: "from-orange-500/20 to-red-500/20",
      iconColor: "text-orange-400",
      suffix: "days",
    },
    {
      label: "Health Score",
      value: stats?.healthScore ?? 0,
      icon: Heart,
      gradient: "from-rose-500/20 to-pink-500/20",
      iconColor: "text-rose-400",
      suffix: "",
    },
    {
      label: "Total Logs",
      value: stats?.totalLogs ?? 0,
      icon: Activity,
      gradient: "from-teal-500/20 to-green-500/20",
      iconColor: "text-teal-400",
      suffix: "",
    },
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 px-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-11 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 px-3">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.label}
            href="/my-book"
            className="flex items-center gap-3 rounded-xl px-2 py-1.5 transition-colors hover:bg-[var(--bg-overlay)]"
          >
            <div
              className={`flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${item.gradient}`}
            >
              <Icon className={`size-4 ${item.iconColor}`} />
            </div>
            <div className="flex flex-1 items-baseline justify-between">
              <span className="text-[11px] text-muted-foreground">{item.label}</span>
              <span className="text-sm font-bold">
                {item.value}
                {item.suffix && (
                  <span className="text-[10px] font-normal text-muted-foreground">
                    {" "}
                    {item.suffix}
                  </span>
                )}
              </span>
            </div>
          </Link>
        );
      })}
      <Link
        href="/my-book"
        className="mt-1 flex items-center justify-center gap-1 text-[10px] font-medium text-brand-teal transition-colors hover:text-brand-green"
      >
        View full dashboard
        <ArrowRight className="size-3" />
      </Link>
    </div>
  );
}

function SuggestedSection() {
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

  if (users.length === 0) return null;

  return (
    <div className="flex flex-col gap-1 px-3">
      {users.slice(0, 6).map((u) => (
        <div key={u.id} className="flex items-center gap-3 rounded-xl px-2 py-1.5">
          <Link href={`/${u.username}`} className="shrink-0">
            <UserAvatar
              name={u.name}
              avatar={u.avatar}
              ring={u.isVerified ? "premium" : "default"}
              size="sm"
            />
          </Link>
          <Link href={`/${u.username}`} className="min-w-0 flex-1">
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
        className="mt-1 text-center text-[10px] font-medium text-brand-teal transition-colors hover:text-brand-green"
      >
        View all
      </Link>
    </div>
  );
}

function TrendingSection() {
  const { data, isLoading } = useBrowseChallengesQuery({});
  const challenges = (data?.challenges ?? []).slice(0, 3);
  const isEmpty = !isLoading && challenges.length === 0;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 px-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 rounded-xl" />
        ))}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="flex flex-col gap-2 px-3">
        <p className="text-xs text-muted-foreground px-2">No challenges yet.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 px-3">
      {challenges.map((c) => (
        <Link
          key={c.id}
          href={`/challenges/${c.id}`}
          className="group flex items-center gap-3 rounded-xl px-2 py-1.5 transition-colors hover:bg-[var(--bg-overlay)]"
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20">
            <Trophy className="size-4 text-amber-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium group-hover:text-brand-teal">{c.title}</p>
            {"participantCount" in c && c.participantCount !== undefined && (
              <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Users className="size-3" />
                {c.participantCount} participants
              </p>
            )}
          </div>
          <ArrowRight className="size-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        </Link>
      ))}
      <Link
        href="/challenges"
        className="mt-1 text-center text-[10px] font-medium text-brand-teal transition-colors hover:text-brand-green"
      >
        View all challenges
      </Link>
    </div>
  );
}

function TagsSection() {
  return (
    <div className="flex flex-wrap gap-1 px-3">
      {CURATED_TAGS.slice(0, 12).map((tag) => (
        <Link
          key={tag}
          href={`/hashtag/${tag}`}
          className="inline-flex items-center rounded-full border border-[var(--glass-border)] bg-[var(--bg-overlay)] px-2 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors hover:border-brand-teal/40 hover:bg-brand-teal/10 hover:text-brand-teal"
        >
          #{tag}
        </Link>
      ))}
    </div>
  );
}

export default function RightSidebar() {
  return (
    <aside className="hidden xl:flex fixed right-0 top-14 bottom-0 w-96 flex-col bg-[var(--glass-bg)] backdrop-blur-2xl border-l border-[var(--glass-border)] p-4">
      <nav className="flex flex-1 flex-col gap-2 overflow-y-auto scrollbar-none">
        <SectionLabel>Stats</SectionLabel>
        <StatsSection />

        <Divider />
        <ActiveNow />

        <Divider />
        <SectionLabel>Suggested</SectionLabel>
        <SuggestedSection />

        <Divider />
        <SectionLabel>Trending</SectionLabel>
        <TrendingSection />

        <Divider />
        <SectionLabel>Trending Tags</SectionLabel>
        <TagsSection />
      </nav>

      <Divider />
      <p className="text-center text-[10px] text-muted-foreground/40">HealthBook v1.0</p>
    </aside>
  );
}
