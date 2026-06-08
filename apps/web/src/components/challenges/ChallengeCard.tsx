"use client";

import { memo, useState } from "react";
import Link from "next/link";
import {
  Trophy,
  Users,
  Target,
  Plus,
  CheckCircle,
  Bookmark,
  Flame,
  Swords,
  Star,
  ShieldAlert,
  UserPlus,
} from "lucide-react";
import type { Challenge } from "@/types/challenge";
import { cn } from "@/lib/utils";
import { ChallengeGoalDisplay } from "./ChallengeGoalDisplay";
import { ChallengeMilestones } from "./ChallengeMilestones";

const typeConfig = {
  SOLO: { icon: Target, label: "Solo", class: "bg-brand-blue/10 text-brand-blue" },
  GROUP: { icon: Users, label: "Group", class: "bg-brand-teal/10 text-brand-teal" },
  PLATFORM: { icon: Trophy, label: "Platform", class: "bg-brand-amber/10 text-brand-amber" },
  DUEL: { icon: Swords, label: "Duel", class: "bg-brand-coral/10 text-brand-coral" },
};

const difficultyColors: Record<string, string> = {
  BEGINNER: "bg-green-500/10 text-green-500 border-green-500/20",
  INTERMEDIATE: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  ADVANCED: "bg-red-500/10 text-red-500 border-red-500/20",
};

const categoryColors: Record<string, string> = {
  FITNESS: "bg-green-500/10 text-green-500",
  NUTRITION: "bg-orange-500/10 text-orange-500",
  MENTAL_HEALTH: "bg-purple-500/10 text-purple-500",
  SLEEP: "bg-blue-500/10 text-blue-500",
  GENERAL: "bg-gray-500/10 text-gray-400",
};

function StarRating({ avg, count }: { avg?: number; count?: number }) {
  if (!count || avg == null) return null;
  return (
    <span className="flex items-center gap-1 text-[10px] text-brand-amber">
      <Star className="size-3 fill-brand-amber" />
      {avg?.toFixed(1)}
      <span className="text-[var(--text-muted)]">({count})</span>
    </span>
  );
}

export const ChallengeCard = memo(function ChallengeCard({
  challenge,
  onLogProgress,
  onToggleSave,
}: {
  challenge: Challenge;
  onLogProgress?: (id: string) => void;
  onToggleSave?: (id: string) => void;
}) {
  const [now] = useState(() => Date.now());
  const TypeIcon = typeConfig[challenge.type].icon;
  const progress = challenge.myProgress;
  const isPastEndDate = new Date(challenge.endDate) < new Date();
  const canLog = challenge.isJoined && progress && !progress.completed && !isPastEndDate;
  const daysLeft = Math.max(0, Math.ceil((new Date(challenge.endDate).getTime() - now) / 86400000));

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] transition-all duration-300 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-lg)]">
      {/* Top accent bar */}
      <div
        className={cn(
          "h-1 w-full",
          challenge.type === "SOLO" && "bg-gradient-to-r from-brand-blue to-brand-cyan",
          challenge.type === "GROUP" && "bg-gradient-to-r from-brand-teal to-brand-green",
          challenge.type === "PLATFORM" && "bg-gradient-to-r from-brand-amber to-brand-coral",
          challenge.type === "DUEL" && "bg-gradient-to-r from-brand-coral to-brand-pink",
        )}
      />

      <Link href={`/challenges/${challenge.id}`} prefetch={false} className="block p-3 sm:p-4 pt-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-sm font-bold text-[var(--text-primary)]">
                {challenge.title}
              </h3>
              {progress?.completed && <CheckCircle className="size-4 shrink-0 text-brand-teal" />}
            </div>
            <p className="mt-0.5 line-clamp-2 text-xs text-[var(--text-secondary)]">
              {challenge.description}
            </p>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-semibold",
                typeConfig[challenge.type].class,
              )}
            >
              <TypeIcon className="size-3" />
              {typeConfig[challenge.type].label}
            </span>
            {challenge.category && challenge.category !== "GENERAL" && (
              <span
                className={cn(
                  "inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-semibold",
                  categoryColors[challenge.category] || categoryColors["GENERAL"],
                )}
              >
                {challenge.category.replace("_", " ")}
              </span>
            )}
            {challenge.difficulty && (
              <span
                className={cn(
                  "inline-flex items-center rounded-lg border px-2 py-0.5 text-[10px] font-semibold",
                  difficultyColors[challenge.difficulty] || difficultyColors["BEGINNER"],
                )}
              >
                {challenge.difficulty}
              </span>
            )}
          </div>
        </div>

        <div className="mt-2 flex items-center gap-2 text-[10px] text-[var(--text-muted)] flex-wrap">
          {daysLeft > 0 ? (
            <span className="flex items-center gap-1 rounded-full bg-brand-amber/10 px-2 py-0.5 font-semibold text-brand-amber">
              <Flame className="size-3" /> {daysLeft}d left
            </span>
          ) : (
            <span className="rounded-full bg-red-500/10 px-2 py-0.5 font-semibold text-red-400">
              Ended
            </span>
          )}
          <span className="flex items-center gap-1">
            <Users className="size-3" />
            {challenge.participantCount}
          </span>
          {/* Social proof: friend count */}
          {challenge.friendCount > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-brand-blue/10 px-2 py-0.5 font-semibold text-brand-blue">
              <UserPlus className="size-3" />
              {challenge.friendCount} friend{challenge.friendCount !== 1 ? "s" : ""}
            </span>
          )}
          {/* Social proof: completion count */}
          {challenge.totalCompleted > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-brand-teal/10 px-2 py-0.5 font-semibold text-brand-teal">
              <CheckCircle className="size-3" />
              {challenge.totalCompleted} done
            </span>
          )}
          {challenge.prize && (
            <span className="flex items-center gap-1">
              <Trophy className="size-3" />
              {challenge.prize}
            </span>
          )}
          {/* Star rating */}
          <StarRating avg={challenge.averageRating} count={challenge.ratingCount} />
        </div>

        {challenge.isJoined && progress && (
          <div className="mt-3 space-y-1">
            <ChallengeGoalDisplay
              score={progress.score}
              goal={progress.goal}
              unit={challenge.goalUnit || ""}
            />
            <div className="h-1.5 overflow-hidden rounded-full bg-[var(--bg-subtle)]">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  progress.completed
                    ? "bg-gradient-to-r from-brand-teal to-brand-green"
                    : "bg-gradient-to-r from-brand-amber to-brand-coral",
                )}
                style={{ width: `${Math.min(progress.pct, 100)}%` }}
              />
            </div>
            {challenge.milestones && (
              <ChallengeMilestones
                milestones={challenge.milestones}
                achieved={progress.achievedMilestones}
                score={progress.score}
              />
            )}
          </div>
        )}
      </Link>

      {/* Action buttons */}
      <div className="flex items-center justify-between border-t border-[var(--border-default)] px-4 py-2">
        <div className="flex items-center gap-1">
          {onToggleSave && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleSave(challenge.id);
              }}
              className={cn(
                "flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold transition-colors",
                challenge.isSaved
                  ? "text-brand-teal"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]",
              )}
            >
              <Bookmark className={cn("size-3", challenge.isSaved && "fill-brand-teal")} />
              {challenge.isSaved ? "Saved" : "Save"}
            </button>
          )}
        </div>

        <div className="flex items-center gap-1">
          {canLog && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onLogProgress?.(challenge.id);
              }}
              className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-brand-teal to-brand-green px-3 py-1 text-[10px] font-bold text-white shadow-[var(--shadow-glow-teal)] transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="size-3" /> Log Progress
            </button>
          )}
          {challenge.isJoined && progress?.completed && (
            <span className="flex items-center gap-1 rounded-lg bg-brand-teal/10 px-2 py-1 text-[10px] font-semibold text-brand-teal">
              <CheckCircle className="size-3" /> Done
            </span>
          )}
          {/* Duel full */}
          {!challenge.isJoined && challenge.isFull && (
            <span className="flex items-center gap-1 rounded-lg bg-brand-coral/10 px-2 py-1 text-[10px] font-semibold text-brand-coral">
              <ShieldAlert className="size-3" /> Duel Full
            </span>
          )}
          {/* Group: must join group first */}
          {!challenge.isJoined && !challenge.isFull && challenge.requiredGroup && (
            <span className="flex items-center gap-1 rounded-lg bg-brand-amber/10 px-2 py-1 text-[10px] font-semibold text-brand-amber">
              <Users className="size-3" /> Join group first
            </span>
          )}
          {/* Default unjoined state */}
          {!challenge.isJoined && !challenge.isFull && !challenge.requiredGroup && (
            <span className="text-[10px] text-[var(--text-muted)]">
              {challenge.type === "SOLO"
                ? "Join to start"
                : `${challenge.participantCount} participants`}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});
