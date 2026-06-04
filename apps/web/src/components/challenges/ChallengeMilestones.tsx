"use client";

import { cn } from "@/lib/utils";
import type { ChallengeMilestone as TChallengeMilestone } from "@/types/challenge";

export function ChallengeMilestones({
  milestones,
  achieved,
  score,
}: {
  milestones: TChallengeMilestone[];
  achieved: string[];
  score: number;
}) {
  if (!milestones.length) return null;

  return (
    <div className="flex items-center gap-2">
      {milestones.map((m) => {
        const isAchieved = achieved.includes(m.name) || score >= m.threshold;
        return (
          <div
            key={m.name}
            className={cn(
              "flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold transition-all",
              isAchieved
                ? "bg-gradient-to-r from-brand-amber/20 to-brand-coral/20 text-brand-amber border border-brand-amber/20"
                : "bg-[var(--bg-subtle)] text-[var(--text-muted)] border border-transparent opacity-50",
            )}
            title={`${m.name}: ${m.threshold} pts`}
          >
            <span>{isAchieved ? m.icon : "○"}</span>
            <span>{m.name}</span>
          </div>
        );
      })}
    </div>
  );
}
