"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { CURATED_TAGS } from "@/lib/constants";
import { useBrowseChallengesQuery } from "@/redux/api/challengesApi";
import { useGetHealthStatsQuery } from "@/redux/api/healthLogApi";
import { ArrowRight, Flame, Heart, Trophy, Users, Activity } from "lucide-react";
import Link from "next/link";
import { ActiveNow } from "./ActiveNow";
import { SuggestedSection } from "./SuggestedSection";

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
            prefetch={false}
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
        prefetch={false}
        className="mt-1 flex items-center justify-center gap-1 text-[10px] font-medium text-brand-teal transition-colors hover:text-brand-green"
      >
        View full dashboard
        <ArrowRight className="size-3" />
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
      <div className="flex flex-col items-center gap-2 px-3 py-4 text-center">
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
          prefetch={false}
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
        prefetch={false}
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
          prefetch={false}
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
    <aside className="hidden xl:flex fixed right-0 top-14 bottom-0 w-96 flex-col bg-[var(--glass-bg)] backdrop-blur-md md:backdrop-blur-2xl border-l border-[var(--glass-border)] p-4">
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
