import type { LeaderboardEntry } from "@/types/challenge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const rankIcons = ["🥇", "🥈", "🥉"];

export function LeaderboardRow({
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
  const showDayProgress = dayCount != null;
  const showQuantProgress = goalTarget != null && goalUnit != null;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-[var(--bg-overlay)]",
        entry.completed && "ring-1 ring-brand-teal/20",
      )}
    >
      <span className="flex size-8 shrink-0 items-center justify-center text-sm font-bold">
        {entry.rank <= 3 ? (
          <span className="text-lg">{rankIcons[entry.rank - 1]}</span>
        ) : (
          <span className="text-[var(--text-muted)]">#{entry.rank}</span>
        )}
      </span>
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Avatar size="sm" className="size-8">
          {entry.user.avatar ? <AvatarImage src={entry.user.avatar} alt={entry.user.name} /> : null}
          <AvatarFallback className="bg-gradient-to-br from-brand-teal to-brand-green text-xs text-white">
            {entry.user.name.charAt(0)?.toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
            {entry.user.name}
          </p>
          <p className="text-[10px] text-[var(--text-muted)]">
            {showDayProgress && `${entry.score} / ${dayCount}d`}
            {showDayProgress && showQuantProgress && " · "}
            {showQuantProgress && `${entry.totalValue ?? 0} / ${goalTarget} ${goalUnit}`}
          </p>
          {entry.completed && entry.completedAt && (
            <p className="text-[10px] text-brand-teal">Completed</p>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {entry.totalValue != null && entry.totalValue > 0 && entry.completed && (
          <span className="text-[10px] text-[var(--text-muted)]">{entry.totalValue}</span>
        )}
        <span
          className={cn(
            "text-sm font-bold",
            entry.completed ? "text-brand-teal" : "text-[var(--text-primary)]",
          )}
        >
          {entry.completed ? <Check className="size-4" /> : entry.score}
        </span>
      </div>
    </div>
  );
}
