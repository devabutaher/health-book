"use client";

import { motion } from "framer-motion";
import type { ChallengeProgress as TChallengeProgress } from "@/types/challenge";
import { ChallengeGoalDisplay } from "./ChallengeGoalDisplay";
import { ChallengeMilestones } from "./ChallengeMilestones";
import type { ChallengeMilestone as TChallengeMilestone } from "@/types/challenge";

export function ChallengeProgress({
  progress,
  milestones,
  showMilestones = true,
}: {
  progress: TChallengeProgress;
  milestones?: TChallengeMilestone[] | null;
  showMilestones?: boolean;
}) {
  const { score, goal, pct, completed, achievedMilestones, totalValue, goalTarget, goalUnit } =
    progress;

  const hasQuantitativeGoal = goalTarget != null && goalUnit != null;
  const valuePct =
    goalTarget && goalTarget > 0 ? Math.min(((totalValue ?? 0) / goalTarget) * 100, 100) : 0;

  return (
    <div className="rounded-xl bg-gradient-to-br from-brand-teal/[0.07] to-brand-green/[0.05] p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-[var(--text-secondary)]">Progress</span>
        <span className="flex items-center gap-2">
          {completed && (
            <span className="rounded-full bg-brand-teal/10 px-2 py-0.5 text-[10px] font-bold text-brand-teal">
              ✓ Complete
            </span>
          )}
        </span>
      </div>

      <ChallengeGoalDisplay score={score} goal={goal} unit="days" className="mb-2" />

      <div className="relative h-2.5 overflow-hidden rounded-full bg-[var(--bg-elevated)]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(pct, 100)}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full rounded-full transition-all ${
            completed
              ? "bg-gradient-to-r from-brand-teal to-brand-green"
              : "bg-gradient-to-r from-brand-amber to-brand-coral"
          }`}
        />
      </div>

      <div className="mt-1 flex justify-between text-[10px] text-[var(--text-muted)]">
        <span>{Math.round(pct)}% complete</span>
        <span>
          Day {score} / {goal}
        </span>
      </div>

      {hasQuantitativeGoal && (
        <div className="mt-3 rounded-lg bg-[var(--bg-subtle)] p-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">
              Total {goalUnit}
            </span>
            <span className="text-xs font-bold text-[var(--text-primary)]">
              {(totalValue ?? 0).toFixed(1)} / {goalTarget} {goalUnit}
            </span>
          </div>
          <div className="relative h-2 overflow-hidden rounded-full bg-[var(--bg-elevated)]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${valuePct}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-brand-blue to-brand-teal"
            />
          </div>
        </div>
      )}

      {showMilestones && milestones && (
        <div className="mt-3">
          <ChallengeMilestones
            milestones={milestones}
            achieved={achievedMilestones}
            score={score}
          />
        </div>
      )}
    </div>
  );
}
