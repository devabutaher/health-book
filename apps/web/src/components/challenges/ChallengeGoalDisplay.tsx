"use client";

import { Target } from "lucide-react";
import { cn } from "@/lib/utils";

export function ChallengeGoalDisplay({
  score,
  goal,
  unit,
  className,
}: {
  score: number;
  goal: number;
  unit: string;
  className?: string;
}) {
  const pct = Math.min((score / goal) * 100, 100);
  const isComplete = score >= goal;

  return (
    <div className={cn("flex items-center gap-2 text-xs", className)}>
      <Target className="size-3.5 text-brand-teal shrink-0" />
      <span className="font-semibold text-[var(--text-primary)]">
        {score.toLocaleString()} / {goal.toLocaleString()} {unit}
      </span>
      <span
        className={cn(
          "ml-auto font-bold tabular-nums",
          isComplete ? "text-brand-teal" : "text-brand-amber",
        )}
      >
        {Math.round(pct)}%
      </span>
    </div>
  );
}
