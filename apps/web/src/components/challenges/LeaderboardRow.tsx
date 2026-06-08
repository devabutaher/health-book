import { memo } from "react";
import type { LeaderboardEntry } from "@/types/challenge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Flame, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

const rankIcons = ["🥇", "🥈", "🥉"];

export const LeaderboardRow = memo(function LeaderboardRow({
  entry,
  dayCount,
  goalTarget,
  goalUnit,
}: {
  entry: LeaderboardEntry;
  dayCount?: number;
  goalTarget?: number | null;
  goalUnit?: string | null;
}) {
  const showDayProgress = dayCount != null && dayCount > 0;
  const showQuantProgress = goalTarget != null && goalUnit != null;
  const pct = showDayProgress ? Math.min((entry.score / dayCount!) * 100, 100) : 0;
  const hasStreak = (entry.streak ?? 0) > 1;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-[var(--bg-overlay)]",
        entry.completed && "ring-1 ring-brand-teal/20",
      )}
    >
      {/* Rank */}
      <span className="flex size-8 shrink-0 items-center justify-center text-sm font-bold">
        {entry.rank <= 3 ? (
          <span className="text-lg">{rankIcons[entry.rank - 1]}</span>
        ) : (
          <span className="text-[var(--text-muted)]">#{entry.rank}</span>
        )}
      </span>

      {/* User Info + Progress */}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <Avatar size="sm" className="size-8 shrink-0">
            {entry.user.avatar ? (
              <AvatarImage src={entry.user.avatar} alt={entry.user.name} />
            ) : null}
            <AvatarFallback className="bg-gradient-to-br from-brand-teal to-brand-green text-xs text-white">
              {entry.user.name.charAt(0)?.toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                {entry.user.name}
              </p>
              {hasStreak && (
                <span className="flex shrink-0 items-center gap-0.5 text-[11px] font-bold text-brand-amber">
                  <Flame className="size-3" />
                  {entry.streak}
                </span>
              )}
            </div>
            <p className="text-[10px] text-[var(--text-muted)]">
              {showDayProgress && `${entry.score} / ${dayCount}d`}
              {showDayProgress && showQuantProgress && " · "}
              {showQuantProgress && `${entry.totalValue ?? 0} ${goalUnit}`}
              {showQuantProgress && showDayProgress && " · "}
              {showQuantProgress &&
                !showDayProgress &&
                `${entry.totalValue ?? 0} / ${goalTarget} ${goalUnit}`}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-overlay)]">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              entry.completed
                ? "bg-gradient-to-r from-brand-teal to-brand-green"
                : "bg-gradient-to-r from-brand-blue to-brand-teal",
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Score / Badge */}
      <div className="flex shrink-0 flex-col items-center gap-0.5">
        {entry.completed ? (
          <span className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-teal to-brand-green text-white shadow-[var(--shadow-glow-teal)]">
            <Trophy className="size-4" />
          </span>
        ) : (
          <span className="text-sm font-bold text-[var(--text-primary)]">{entry.score}</span>
        )}
        {entry.completed && <span className="text-[9px] font-semibold text-brand-teal">Done</span>}
      </div>
    </div>
  );
});
